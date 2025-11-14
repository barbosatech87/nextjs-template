import { Locale } from "@/lib/i18n/config";
import type { AIResponse } from "@/app/actions/ai";
import type { EditablePostData } from "@/app/actions/blog";
import { getGeneratedImagesForServer } from "@/server/generated-images";
import { NewPostInitializer } from "@/components/admin/blog/new-post-initializer";
import type { GeneratedImageData } from "@/app/actions/image-generation";

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

  let initialDataFromQuery: Partial<AIResponse> | null = null;

  if (sp?.initialData && typeof sp.initialData === 'string') {
    try {
      initialDataFromQuery = JSON.parse(sp.initialData);
    } catch (error) {
      console.error("Failed to parse initial data from URL", error);
    }
  }

  const typedInitialData: InitialPostData | null = initialDataFromQuery as InitialPostData | null;
  
  // Buscar imagens geradas via helper SSR (evita Server Action durante render)
  const initialImages = await getGeneratedImagesForServer();

  return (
    <NewPostInitializer 
      lang={lang} 
      initialDataFromQuery={typedInitialData}
      initialImages={initialImages as unknown as GeneratedImageData[]}
    />
  );
}