import { Locale } from "@/lib/i18n/config";
import { AiWriterForm } from "@/components/admin/ai-writer/ai-writer-form";

interface AiWriterPageProps {
  params: { lang: Locale };
}

export default function AiWriterPage({ params }: AiWriterPageProps) {
  const { lang } = params;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Post com IA</h1>
        <p className="text-muted-foreground">
          Use o poder da IA para criar rascunhos de postagens para o seu blog.
        </p>
      </div>
      <AiWriterForm lang={lang} />
    </div>
  );
}