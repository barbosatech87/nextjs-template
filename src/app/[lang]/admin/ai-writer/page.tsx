import { Locale } from "@/lib/i18n/config";
import { AppPageProps } from "@/types/app";

export default function AiWriterPage({ params }: AppPageProps<{ lang: Locale }>) {
  const { lang } = params;
  return (
    <div>
      <h1 className="text-2xl font-bold">Post com IA</h1>
      <p>Página para gerar conteúdo de post com IA. (Em construção)</p>
    </div>
  );
}