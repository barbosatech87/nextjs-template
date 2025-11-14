import { Locale } from "@/lib/i18n/config";

interface AiImageGeneratorPageProps {
  params: Awaited<{ lang: Locale }>;
}

export default async function AiImageGeneratorPage({ params }: AiImageGeneratorPageProps) {
  const { lang } = params;
  return (
    <div>
      <h1 className="text-2xl font-bold">Gerador de Imagem com IA</h1>
      <p>Página para gerar imagens com IA. (Em construção)</p>
    </div>
  );
}