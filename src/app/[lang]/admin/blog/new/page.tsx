import { LocalizedPageProps } from "@/types/next";

export default function NewPostPage({ params: { lang } }: LocalizedPageProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold">Nova Postagem</h1>
      <p>Página para criar uma nova postagem no blog. (Em construção)</p>
    </div>
  );
}