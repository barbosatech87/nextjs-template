"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Brain, Send, User, Loader2, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { getAiChatResponse } from '@/app/actions/chat';
import { cn } from '@/lib/utils';
import { Locale } from '@/lib/i18n/config';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  lang: Locale;
}

export function ChatInterface({ lang }: ChatInterfaceProps) {
  const welcomeMessages = {
    pt: "Olá! Como posso ajudá-lo a estudar a Bíblia hoje?",
    en: "Hello! How can I help you study the Bible today?",
    es: "¡Hola! ¿Cómo puedo ayudarte a estudiar la Biblia hoy?",
  };

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: welcomeMessages[lang] || welcomeMessages.pt },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaViewportRef.current) {
      scrollAreaViewportRef.current.scrollTo({
        top: scrollAreaViewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isLimitReached) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const historyForApi = [...messages, userMessage].map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    const result = await getAiChatResponse(historyForApi, lang);

    if (result.error) {
      const errorMessage: Message = { role: 'assistant', content: result.error };
      setMessages((prev) => [...prev, errorMessage]);
      // Verifica se o erro é de limite atingido para desativar o input
      if (result.error.includes('limite diário')) {
        setIsLimitReached(true);
      }
    } else if (result.content) {
      const assistantMessage: Message = { role: 'assistant', content: result.content };
      setMessages((prev) => [...prev, assistantMessage]);
    }
    
    setIsLoading(false);
  };

  return (
    <Card className="h-full flex flex-col shadow-lg">
      <ScrollArea className="flex-grow p-4" viewportRef={scrollAreaViewportRef}>
        <div className="space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="bg-primary text-primary-foreground rounded-full p-2">
                  <Brain className="h-5 w-5" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-md rounded-lg px-4 py-3 text-sm",
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="bg-secondary text-secondary-foreground rounded-full p-2">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
              <div className="bg-primary text-primary-foreground rounded-full p-2">
                <Brain className="h-5 w-5" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-3">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <CardContent className="p-4 border-t">
        {isLimitReached ? (
          <div className="flex items-center justify-center text-center text-sm text-muted-foreground p-3 bg-muted rounded-lg">
            <MicOff className="h-5 w-5 mr-2" />
            Você atingiu seu limite diário. Volte amanhã!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua pergunta sobre a Bíblia..."
              disabled={isLoading}
              className="flex-grow"
              autoComplete="off"
            />
            <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
              <Send className="h-5 w-5" />
              <span className="sr-only">Enviar</span>
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}