import { Locale } from "@/lib/i18n/config";
import { AiImageGeneratorForm } from "@/components/admin/ai-image-generator/ai-image-generator-form";
import { ImageGallery } from "@/components/admin/ai-image-generator/image-gallery";
import { getGeneratedImages } from "@/app/actions/image-generation";
import { LocalizedPageProps } from "@/types/next-app";

const texts = {
  pt: {
    title: "Gerador de Imagens com IA",
    subtitle: "Crie imagens conceituais para ilustrar suas postagens de blog.",
  },
  en: {
    title: "AI Image Generator",
    subtitle: "Create conceptual images to illustrate your blog posts.",
  },
  es: {
    title: "Generador de Imágenes con IA",
    subtitle: "Crea imágenes conceptuales para ilustrar tus entradas de blog.",
  },
};

export default async function AiImageGeneratorPage({ params }: LocalizedPageProps) {
  const { lang } = params;
  const t = texts[lang] || texts.pt;
  
  const images = await getGeneratedImages();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>
      
      <AiImageGeneratorForm lang={lang} />
      
      <ImageGallery images={images} lang={lang} />
    </div>
  );
}