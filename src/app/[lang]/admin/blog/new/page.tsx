import { PostForm } from "@/components/admin/blog/post-form";
import { Locale } from "@/lib/i18n/config";

const texts = {
  pt: {
    title: "Criar Nova Postagem",
  },
  en: {
    title: "Create New Post",
  },
  es: {
    title: "Crear Nueva Entrada",
  },
};

export default async function NewPostPage({ params }: { params: { lang: Locale } }) {
  const { lang } = params;
  const t = texts[lang as keyof typeof texts] || texts.pt;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.title}</h1>
      <PostForm lang={lang} />
    </div>
  );
}