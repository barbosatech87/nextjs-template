import { Locale } from "@/lib/i18n/config";
import { AppPageProps } from "@/types/app";

export default function AiImageGeneratorPage({ params }: AppPageProps<{ lang: Locale }>) {
  const { lang } = params;
  return (
    <div>
      <h1 className="text-2xl font-bold">Gerador de Imagem com IA</h1>
      <p>Página para gerar imagens com IA. (Em construção)</p>
    </div>
  );
}