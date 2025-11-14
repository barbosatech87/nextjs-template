import { PostForm } from "@/components/admin/blog/post-form";
import { Locale } from "@/lib/i18n/config";
import { LocalizedPageProps } from "@/types/next-app";
import { getPostById, EditablePostData } from "@/app/actions/blog";
import { notFound } from "next/navigation";
import { AIResponse } from "@/app/actions/ai"; // Import necessário para o tipo

const texts = {
  pt: {
    title: "Editar Postagem",
    description: "Atualize os detalhes da postagem do blog.",
    loadingError: "Não foi possível carregar a postagem para edição.",
  },
  en: {
    title: "Edit Post",
    description: "Update the details of the blog post.",
    loadingError: "Could not load the post for editing.",
  },
  es: {
    title: "Editar Entrada",
    description: "Actualiza los detalles de la entrada del blog.",
    loadingError: "No se pudo cargar la entrada para editar.",
  },
};

// Definindo o tipo InitialPostData localmente para evitar importação circular
type PostStatus = 'draft' | 'published' | 'archived';
type InitialPostData = Partial<Omit<EditablePostData, 'status'>> & Partial<AIResponse> & {
  status?: PostStatus;
  category_ids?: string[];
};

interface EditPostPageProps extends LocalizedPageProps<{ postId: string }> {}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { lang, postId } = params;
  const t = texts[lang] || texts.pt;

  const initialData = await getPostById(postId);

  if (!initialData) {
    notFound();
  }

  // Força a atribuição do tipo para resolver o erro de compatibilidade de null/undefined
  const typedInitialData: InitialPostData = initialData as InitialPostData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground">{t.description}</p>
      </div>
      <PostForm lang={lang} initialData={typedInitialData} isEditing={true} postId={postId} />
    </div>
  );
}