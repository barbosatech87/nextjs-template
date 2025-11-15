import { AiImageGeneratorForm } from '@/components/admin/ai-image-generator/ai-image-generator-form';
import { ImageGallery } from '@/components/admin/ai-image-generator/image-gallery';
import { Locale } from '@/lib/i18n/config';
import { getGeneratedImages } from '@/app/actions/image-generation';

interface AiImageGeneratorPageProps {
    params: Promise<{ lang: Locale }>;
}

export default async function AiImageGeneratorPage({ params }: AiImageGeneratorPageProps) {
    const { lang } = await params;
    // Recarrega as imagens a cada visita
    const images = await getGeneratedImages();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">AI Image Generator</h1>
                <p className="text-muted-foreground">
                    {lang === 'pt' ? 'Gere imagens únicas usando IA para seus posts.' : 'Generate unique images using AI for your posts.'}
                </p>
            </div>
            {/* Aqui, o formulário é usado no modo padrão (não modal), sem onImageSave */}
            <AiImageGeneratorForm lang={lang} />
            <ImageGallery images={images} lang={lang} />
        </div>
    );
}