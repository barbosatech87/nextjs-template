import { PostForm } from "@/components/admin/blog/post-form";
import { Locale } from "@/lib/i18n/config";
import { LocalizedPageProps } from "@/types/next-app";
import { getPostById, EditablePostData } from "@/app/actions/blog";
import { notFound } from "next/navigation";

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

interface EditPostPageProps extends LocalizedPageProps<{ postId: string }> {}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { lang, postId } = params;
  const t = texts[lang] || texts.pt;

  const initialData = await getPostById(postId);

  if (!initialData) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground">{t.description}</p>
      </div>
      <PostForm lang={lang} initialData={initialData} isEditing={true} postId={postId} />
    </div>
  );
}