import { use } from "react";
import { Locale } from "@/lib/i18n/config";

export default function NewPostPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = use(params);
  return (
    <div>
      <h1 className="text-2xl font-bold">Nova Postagem</h1>
      <p>Página para criar uma nova postagem no blog. (Em construção)</p>
    </div>
  );
}