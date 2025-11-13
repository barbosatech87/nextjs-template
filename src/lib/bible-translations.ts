import { Locale } from './i18n/config';

const bookNameTranslations: Record<string, Record<"pt" | "es", string>> = {
  // Antigo Testamento
  "Genesis": { "pt": "Gênesis", "es": "Génesis" },
  "Exodus": { "pt": "Êxodo", "es": "Éxodo" },
  "Leviticus": { "pt": "Levítico", "es": "Levítico" },
  "Numbers": { "pt": "Números", "es": "Números" },
  "Deuteronomy": { "pt": "Deuteronômio", "es": "Deuteronomio" },
  "Joshua": { "pt": "Josué", "es": "Josué" },
  "Judges": { "pt": "Juízes", "es": "Jueces" },
  "Ruth": { "pt": "Rute", "es": "Rut" },
  "1 Samuel": { "pt": "1 Samuel", "es": "1 Samuel" },
  "2 Samuel": { "pt": "2 Samuel", "es": "2 Samuel" },
  "1 Kings": { "pt": "1 Reis", "es": "1 Reyes" },
  "2 Kings": { "pt": "2 Reis", "es": "2 Reyes" },
  "1 Chronicles": { "pt": "1 Crônicas", "es": "1 Crónicas" },
  "2 Chronicles": { "pt": "2 Crônicas", "es": "2 Crónicas" },
  "Ezra": { "pt": "Esdras", "es": "Esdras" },
  "Nehemiah": { "pt": "Neemias", "es": "Nehemías" },
  "Esther": { "pt": "Ester", "es": "Ester" },
  "Job": { "pt": "Jó", "es": "Job" },
  "Psalms": { "pt": "Salmos", "es": "Salmos" },
  "Proverbs": { "pt": "Provérbios", "es": "Proverbios" },
  "Ecclesiastes": { "pt": "Eclesiastes", "es": "Eclesiastés" },
  "Song of Solomon": { "pt": "Cânticos", "es": "Cantares" },
  "Isaiah": { "pt": "Isaías", "es": "Isaías" },
  "Jeremiah": { "pt": "Jeremias", "es": "Jeremías" },
  "Lamentations": { "pt": "Lamentações", "es": "Lamentaciones" },
  "Ezekiel": { "pt": "Ezequiel", "es": "Ezequiel" },
  "Daniel": { "pt": "Daniel", "es": "Daniel" },
  "Hosea": { "pt": "Oséias", "es": "Oseas" },
  "Joel": { "pt": "Joel", "es": "Joel" },
  "Amos": { "pt": "Amós", "es": "Amós" },
  "Obadiah": { "pt": "Obadias", "es": "Abdías" },
  "Jonah": { "pt": "Jonas", "es": "Jonás" },
  "Micah": { "pt": "Miquéias", "es": "Miqueas" },
  "Nahum": { "pt": "Naum", "es": "Nahúm" },
  "Habakkuk": { "pt": "Habacuque", "es": "Habacuc" },
  "Zephaniah": { "pt": "Sofonias", "es": "Sofonías" },
  "Haggai": { "pt": "Ageu", "es": "Hageo" },
  "Zechariah": { "pt": "Zacarias", "es": "Zacarías" },
  "Malachi": { "pt": "Malaquias", "es": "Malaquías" },
  // Novo Testamento
  "Matthew": { "pt": "Mateus", "es": "Mateo" },
  "Mark": { "pt": "Marcos", "es": "Marcos" },
  "Luke": { "pt": "Lucas", "es": "Lucas" },
  "John": { "pt": "João", "es": "Juan" },
  "Acts": { "pt": "Atos", "es": "Hechos" },
  "Romans": { "pt": "Romanos", "es": "Romanos" },
  "1 Corinthians": { "pt": "1 Coríntios", "es": "1 Corintios" },
  "2 Corinthians": { "pt": "2 Coríntios", "es": "2 Corintios" },
  "Galatians": { "pt": "Gálatas", "es": "Gálatas" },
  "Ephesians": { "pt": "Efésios", "es": "Efesios" },
  "Philippians": { "pt": "Filipenses", "es": "Filipenses" },
  "Colossians": { "pt": "Colossenses", "es": "Colosenses" },
  "1 Thessalonians": { "pt": "1 Tessalonicenses", "es": "1 Tesalonicenses" },
  "2 Thessalonians": { "pt": "2 Tessalonicenses", "es": "2 Tesalonicenses" },
  "1 Timothy": { "pt": "1 Timóteo", "es": "1 Timoteo" },
  "2 Timothy": { "pt": "2 Timóteo", "es": "2 Timoteo" },
  "Titus": { "pt": "Tito", "es": "Tito" },
  "Philemon": { "pt": "Filemom", "es": "Filemón" },
  "Hebrews": { "pt": "Hebreus", "es": "Hebreos" },
  "James": { "pt": "Tiago", "es": "Santiago" },
  "1 Peter": { "pt": "1 Pedro", "es": "1 Pedro" },
  "2 Peter": { "pt": "2 Pedro", "es": "2 Pedro" },
  "1 John": { "pt": "1 João", "es": "1 Juan" },
  "2 John": { "pt": "2 João", "es": "2 Juan" },
  "3 John": { "pt": "3 João", "es": "3 Juan" },
  "Jude": { "pt": "Judas", "es": "Judas" },
  "Revelation": { "pt": "Apocalipse", "es": "Apocalipsis" },
};

const slugToBookMap = new Map<string, string>();
Object.keys(bookNameTranslations).forEach(bookName => {
    const slug = bookName.toLowerCase().replace(/\s+/g, '-');
    slugToBookMap.set(slug, bookName);
});

// Mapa reverso para encontrar o nome em inglês a partir da tradução
const reverseTranslationMap: { [key in Locale]?: Map<string, string> } = {};

function generateReverseMap() {
  if (Object.keys(reverseTranslationMap).length > 0) return;
  
  const locales: Locale[] = ['pt', 'es'];
  locales.forEach(lang => {
    const langMap = new Map<string, string>();
    for (const englishName in bookNameTranslations) {
      const translated = bookNameTranslations[englishName][lang as 'pt' | 'es'];
      if (translated) {
        langMap.set(translated.toLowerCase(), englishName);
      }
    }
    reverseTranslationMap[lang] = langMap;
  });
}

generateReverseMap(); // Gera o mapa na inicialização do módulo

export function getBookNameFromSlug(slug: string): string | undefined {
    return slugToBookMap.get(slug);
}

export function getTranslatedBookName(englishName: string, lang: Locale): string {
  if (lang === 'en') {
    return englishName;
  }
  return bookNameTranslations[englishName]?.[lang as 'pt' | 'es'] || englishName;
}

export function getEnglishBookName(translatedName: string, lang: Locale): string | undefined {
  if (lang === 'en') {
    // Se o idioma for inglês, verifica se o nome já é um nome canônico
    return bookNameTranslations[translatedName] ? translatedName : undefined;
  }
  return reverseTranslationMap[lang]?.get(translatedName.toLowerCase());
}