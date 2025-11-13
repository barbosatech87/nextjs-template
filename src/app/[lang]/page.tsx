import { Locale } from "@/lib/i18n/config";
import { AppPageProps } from "@/types/app";

export default function Home({ 
  params, 
}: AppPageProps<{ lang: Locale }>) {
  const { lang } = params;
  
  return (
    <div className="container px-4 md:px-8 py-12">
      <div className="flex flex-col gap-8 items-center sm:items-start">
        <h1 className="text-3xl font-bold">Bem-vindo ao Bíblia & IA!</h1>
        <p>Conteúdo da página inicial será adicionado aqui.</p>
      </div>
    </div>
  );
}