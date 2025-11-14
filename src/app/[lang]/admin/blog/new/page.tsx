import { PostForm } from "@/components/admin/blog/post-form";
import { Locale } from "@/lib/i18n/config";
import { AIResponse } from "@/app/actions/ai";
import { EditablePostData } from "@/app/actions/blog";
import { getGeneratedImagesForServer } from "@/server/generated-images";

// Definindo o tipo InitialPostData localmente para evitar importação circular
type PostStatus = 'draft' | 'published' | 'archived';
type InitialPostData = Partial<Omit<EditablePostData, 'status'>> & Partial<AIResponse> & {
  status?: PostStatus;
  category_ids?: string[];
};

interface NewPostPageProps {
  params: Promise<{ lang: Locale }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined } | undefined>;
}

export default async function NewPostPage({
  params,
  searchParams,
}: NewPostPageProps) {
  const { lang } = await params;
  const sp = await searchParams;

  let initialData: Partial<AIResponse> | null = null;

  if (sp?.initialData && typeof sp.initialData === 'string') {
    try {
      initialData = JSON.parse(sp.initialData);
    } catch (error) {
      console.error("Failed to parse initial data from URL", error);
    }
  }

  const typedInitialData: InitialPostData | null = initialData as InitialPostData | null;
  
  // Buscar imagens geradas via helper SSR (evita Server Action durante render)
  const initialImages = await getGeneratedImagesForServer();

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
      <PostForm 
        lang={lang} 
        initialData={typedInitialData} 
        initialImages={initialImages}
      />
    </div>
  );
}