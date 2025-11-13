import { LocalizedPageProps } from "@/types/next";

export default function AiWriterPage({ params: { lang } }: LocalizedPageProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold">Post com IA</h1>
      <p>Página para gerar conteúdo de post com IA. (Em construção)</p>
    </div>
  );
}