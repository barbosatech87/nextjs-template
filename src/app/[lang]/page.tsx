import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { LocalizedPageProps } from "@/types/next";
import { use } from "react";

export default async function Home({ 
  params, 
}: LocalizedPageProps) {
  const { lang } = use(params);
  
  return (
    <>
      <Header lang={lang} />
      <div className="flex-grow container px-4 md:px-8 py-12">
        <main className="flex flex-col gap-8 items-center sm:items-start">
          <h1 className="text-3xl font-bold">Bem-vindo ao Bíblia & IA!</h1>
          <p>Conteúdo da página inicial será adicionado aqui.</p>
        </main>
      </div>
      <Footer lang={lang} />
    </>
  );
}