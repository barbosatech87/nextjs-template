import { use } from "react";
import { Locale } from "@/lib/i18n/config";

export default function AiWriterPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = use(params);
  return (
    <div>
      <h1 className="text-2xl font-bold">Post com IA</h1>
      <p>Página para gerar conteúdo de post com IA. (Em construção)</p>
    </div>
  );
}