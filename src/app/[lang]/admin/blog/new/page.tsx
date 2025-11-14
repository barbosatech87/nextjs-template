import { PostForm } from "@/components/admin/blog/post-form";
import { Locale } from "@/lib/i18n/config";
import { AIResponse } from "@/app/actions/ai";
import { EditablePostData } from "@/app/actions/blog"; // Import necessário

// Definindo o tipo InitialPostData localmente para evitar importação circular
type PostStatus = 'draft' | 'published' | 'archived';
type InitialPostData = Partial<Omit<EditablePostData, 'status'>> & Partial<AIResponse> & {
  status?: PostStatus;
  category_ids?: string[];
};

interface NewPostPageProps {
  params: { lang: Locale };
  searchParams: { [key: string]: string | string[] | undefined } | undefined;
}

export default async function NewPostPage({
  params,
  searchParams,
}: NewPostPageProps) {
  const { lang } = params;
  let initialData: Partial<AIResponse> | null = null;

  if (searchParams?.initialData && typeof searchParams.initialData === 'string') {
    try {
      initialData = JSON.parse(searchParams.initialData);
    } catch (error) {
      console.error("Failed to parse initial data from URL", error);
      // Opcional: Adicionar um toast de erro aqui se necessário
    }
  }

  // Força a atribuição do tipo para resolver o erro de compatibilidade
  const typedInitialData: InitialPostData | null = initialData as InitialPostData | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {initialData ? "Revisar Post Gerado por IA" : "Criar Nova Postagem"}
        </h1>
        <p className="text-muted-foreground">
          {initialData
            ? "Ajuste o conteúdo gerado pela IA antes de publicar."
            : "Preencha os detalhes abaixo para criar uma nova postagem no blog."}
        </p>
      </div>
      <PostForm lang={lang} initialData={typedInitialData} />
    </div>
  );
}