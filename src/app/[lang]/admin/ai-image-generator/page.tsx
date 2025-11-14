import { AiImageGeneratorForm } from '@/components/admin/ai-image-generator/ai-image-generator-form';
import { ImageGallery } from '@/components/admin/ai-image-generator/image-gallery';
import { Locale } from '@/lib/i18n/config';

interface AiImageGeneratorPageProps {
    params: { lang: Locale };
}

export default function AiImageGeneratorPage({ params }: AiImageGeneratorPageProps) {
    const { lang } = params;
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">AI Image Generator</h1>
                <p className="text-muted-foreground">
                    {lang === 'pt' ? 'Gere imagens únicas usando IA para seus posts.' : 'Generate unique images using AI for your posts.'}
                </p>
            </div>
            <AiImageGeneratorForm />
            <ImageGallery />
        </div>
    );
}