import { Locale } from "@/lib/i18n/config";
import { HeroSearch } from "@/components/home/hero-search";

const homeTexts = {
  pt: {
    title: "Explore a Palavra",
    subtitle: "Busque versículos, capítulos e artigos. Encontre a inspiração que você precisa.",
    searchPlaceholder: "Digite um versículo, livro ou tópico...",
    searchButton: "Buscar",
  },
  en: {
    title: "Explore the Word",
    subtitle: "Search for verses, chapters, and articles. Find the inspiration you need.",
    searchPlaceholder: "Enter a verse, book, or topic...",
    searchButton: "Search",
  },
  es: {
    title: "Explora la Palabra",
    subtitle: "Busca versículos, capítulos y artículos. Encuentra la inspiración que necesitas.",
    searchPlaceholder: "Escribe un versículo, libro o tema...",
    searchButton: "Buscar",
  },
};

export default function Home({ 
  params, 
}: {
  params: { lang: Locale };
}) {
  const { lang } = params;
  const texts = homeTexts[lang] || homeTexts.pt;
  
  return (
    <div className="container px-4 md:px-8">
      <section className="flex flex-col items-center justify-center text-center py-20 md:py-32">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4">
          {texts.title}
        </h1>
        <p className="max-w-3xl text-lg md:text-xl text-muted-foreground mb-8">
          {texts.subtitle}
        </p>
        <HeroSearch 
          lang={lang} 
          texts={{
            placeholder: texts.searchPlaceholder,
            button: texts.searchButton,
          }}
        />
      </section>
    </div>
  );
}