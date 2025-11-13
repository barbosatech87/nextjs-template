import { LocalizedPageProps } from "@/types/next";
import { PostForm } from "@/components/admin/blog/post-form";
import { use } from "react";

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

export default async function NewPostPage({ params }: LocalizedPageProps) {
  const { lang } = use(params);
  const t = texts[lang] || texts.pt;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.title}</h1>
      <PostForm lang={lang} />
    </div>
  );
}