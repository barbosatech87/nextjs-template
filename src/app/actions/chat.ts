"use server";

import OpenAI from 'openai';
import { createSupabaseServerClient } from '@/integrations/supabase/server';
import { getEnglishBookName } from '@/lib/bible-translations';
import { Locale } from '@/lib/i18n/config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `Você é um assistente bíblico. Sua função é responder perguntas sobre a Bíblia, versículos e temas relacionados à fé cristã.
- Sempre cite os versículos diretamente do banco de dados quando o usuário pedir uma referência (ex: João 3:16).
- Explique passagens de forma clara, respeitosa e contextualizada, sem inventar informações.
- Se o usuário pedir temas gerais (ex: "fé", "amor", "esperança"), sugira versículos relacionados e ofereça uma breve reflexão.
- Se a pergunta não for sobre a Bíblia, responda educadamente que este chat é dedicado apenas a estudos bíblicos.
- Mantenha as respostas organizadas em tópicos ou parágrafos curtos para facilitar a leitura.
- Adapte o tom: acadêmico (histórico/teológico) ou devocional (aplicação prática), conforme o pedido do usuário.`;

async function getBibleVerse(book: string, chapter: number, verse_number: number, lang: Locale) {
  console.log(`Buscando versículo: ${book} ${chapter}:${verse_number} em ${lang}`);
  const supabase = await createSupabaseServerClient();
  
  const englishBookName = getEnglishBookName(book, lang);

  if (!englishBookName) {
    return `Não foi possível encontrar o livro "${book}". Por favor, verifique o nome.`;
  }

  const { data, error } = await supabase
    .from('verses')
    .select('text')
    .eq('book', englishBookName)
    .eq('chapter', chapter)
    .eq('verse_number', verse_number)
    .eq('language_code', lang)
    .single();

  if (error || !data) {
    console.error('Erro ao buscar versículo:', error);
    return `Não encontrei o versículo ${englishBookName} ${chapter}:${verse_number} na versão para o idioma ${lang}. Verifique a referência.`;
  }

  return data.text;
}

export async function getAiChatResponse(
  history: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  lang: Locale
) {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Autenticação necessária.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Apenas usuários não-admin têm limite
  if (profile?.role !== 'admin') {
    const { data: allowed, error: rpcError } = await supabase.rpc('increment_chat_message_count');

    if (rpcError) {
      console.error('Erro ao verificar limite de mensagens:', rpcError);
      return { error: 'Não foi possível verificar seu limite de uso. Tente novamente.' };
    }

    if (!allowed) {
      return { error: 'Você atingiu seu limite diário de 5 mensagens. Por favor, volte amanhã para continuar a conversa.' };
    }
  }

  try {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history,
    ];

    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'get_bible_verse',
          description: 'Obtém o texto de um versículo bíblico específico do banco de dados.',
          parameters: {
            type: 'object',
            properties: {
              book: { type: 'string', description: 'O nome do livro da Bíblia. Ex: Gênesis, Mateus, Apocalipse.' },
              chapter: { type: 'number', description: 'O número do capítulo.' },
              verse_number: { type: 'number', description: 'O número do versículo.' },
            },
            required: ['book', 'chapter', 'verse_number'],
          },
        },
      },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools,
      tool_choice: 'auto',
    });

    const responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    if (toolCalls) {
      messages.push(responseMessage);

      for (const toolCall of toolCalls) {
        if (toolCall.type === 'function') {
          const functionName = toolCall.function.name;
          if (functionName === 'get_bible_verse') {
            const functionArgs = JSON.parse(toolCall.function.arguments);
            const functionResponse = await getBibleVerse(
              functionArgs.book,
              functionArgs.chapter,
              functionArgs.verse_number,
              lang
            );

            messages.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              content: functionResponse,
            });
          }
        }
      }

      const secondResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
      });

      return { content: secondResponse.choices[0].message.content };
    }

    return { content: response.choices[0].message.content };
  } catch (error) {
    console.error('Erro na chamada da API OpenAI:', error);
    return { error: 'Desculpe, não foi possível processar sua solicitação no momento.' };
  }
}