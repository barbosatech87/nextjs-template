import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';

const texts = {
  pt: {
    title: "Você está offline",
    message: "Parece que você perdeu a conexão com a internet. Algumas páginas e funcionalidades podem não estar disponíveis.",
    info: "As páginas que você já visitou devem estar disponíveis no cache."
  },
  en: {
    title: "You are offline",
    message: "It seems you've lost your internet connection. Some pages and features may not be available.",
    info: "Pages you have already visited should be available from the cache."
  },
  es: {
    title: "Estás desconectado",
    message: "Parece que has perdido la conexión a internet. Algunas páginas y funciones pueden no estar disponibles.",
    info: "Las páginas que ya has visitado deberían estar disponibles en la caché."
  }
};

export default function OfflinePage({ params }: { params: { lang: Locale } }) {
  const t = texts[params.lang] || texts.pt;

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 text-destructive p-3 rounded-full w-fit mb-4">
            <WifiOff className="h-8 w-8" />
          </div>
          <CardTitle>{t.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{t.message}</p>
          <p className="text-sm text-muted-foreground">{t.info}</p>
        </CardContent>
      </Card>
    </div>
  );
}