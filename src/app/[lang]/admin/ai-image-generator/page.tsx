import { LocalizedPageProps } from "@/types/next";

export default function AiImageGeneratorPage({ params: { lang } }: LocalizedPageProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold">Gerador de Imagem com IA</h1>
      <p>Página para gerar imagens com IA. (Em construção)</p>
    </div>
  );
}