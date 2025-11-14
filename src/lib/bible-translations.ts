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

// Mapeamento de algarismos romanos para arábicos
const romanToArabicMap: Record<string, string> = {
    'i': '1',
    'ii': '2',
    'iii': '3',
};

/**
 * Converte nomes de livros que começam com algarismos romanos (I, II, III)
 * para o formato arábico (1, 2, 3).
 * Ex: "I Kings" -> "1 Kings", "I Samuel" -> "1 Samuel"
 */
export function convertRomanToArabic(bookName: string): string {
    const parts = bookName.split(' ');
    if (parts.length > 1) {
        const firstPartLower = parts[0].toLowerCase();
        if (romanToArabicMap[firstPartLower]) {
            parts[0] = romanToArabicMap[firstPartLower];
            return parts.join(' ');
        }
    }
    return bookName;
}

function normalizeName(name: string): string {
  return name
    .normalize('NFD') // Decompõe caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
    .toLowerCase()
    .trim();
}

// Cria um mapa de nomes em inglês em minúsculas/normalizadas para os nomes canônicos (que usam arábicos)
const englishNameMap = new Map<string, string>();
Object.keys(bookNameTranslations).forEach(bookName => {
    // Adiciona a versão canônica (ex: "1 samuel")
    englishNameMap.set(normalizeName(bookName), bookName);
});

// Mapa reverso para encontrar o nome em inglês a partir da tradução
const reverseTranslationMap: { [key in Locale]?: Map<string, string> } = {};

function generateReverseMap() {
  if (Object.keys(reverseTranslationMap).length > 0) return;
  
  const locales: Locale[] = ['pt', 'en', 'es'];
  locales.forEach(lang => {
    const langMap = new Map<string, string>();
    for (const englishName in bookNameTranslations) {
      const translated = lang === 'en' 
        ? englishName 
        : bookNameTranslations[englishName as keyof typeof bookNameTranslations]?.[lang as 'pt' | 'es'];
        
      if (translated) {
        // Armazena a versão normalizada (sem acentos e minúsculas) como chave
        langMap.set(normalizeName(translated), englishName);
      }
    }
    reverseTranslationMap[lang] = langMap;
  });
}

generateReverseMap(); // Gera o mapa na inicialização do módulo

export function getBookNameFromSlug(slug: string): string | undefined {
    // Reconstroi o nome do livro a partir do slug e tenta encontrar no mapa de nomes em inglês
    const bookNameFromSlug = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    // Precisa lidar com casos como "1-samuel" -> "1 Samuel"
    const canonicalBookName = Object.keys(bookNameTranslations).find(key => normalizeName(key) === normalizeName(bookNameFromSlug));
    return canonicalBookName;
}

export function getTranslatedBookName(englishName: string, lang: Locale): string {
  if (lang === 'en') {
    return englishName;
  }
  
  // 1. Converte o nome de entrada (que pode vir do DB com romanos) para o formato arábico canônico.
  const canonicalEnglishName = convertRomanToArabic(englishName);

  // 2. Busca a tradução usando a chave canônica
  const translated = bookNameTranslations[canonicalEnglishName as keyof typeof bookNameTranslations]?.[lang as 'pt' | 'es'];
  
  // Retorna a tradução ou o nome original em inglês como fallback
  return translated || englishName;
}

export function getEnglishBookName(dbBookName: string, lang: Locale): string | undefined {
    // 1. Primeiro, converte qualquer numeral romano no nome do DB para arábico.
    const nameWithArabicNumerals = convertRomanToArabic(dbBookName);

    // 2. Normaliza o nome para busca (minúsculas, sem acentos)
    const normalizedName = normalizeName(nameWithArabicNumerals);

    // 3. Tenta encontrar o nome canônico em inglês usando o mapa reverso para o idioma atual.
    // Isso cobre casos onde o DB retorna o nome traduzido (ex: "Gênesis" -> "Genesis")
    const canonicalFromTranslated = reverseTranslationMap[lang]?.get(normalizedName);
    if (canonicalFromTranslated) {
        return canonicalFromTranslated;
    }

    // 4. Se não encontrou no mapa reverso (ex: DB já retornou um nome em inglês, mas não canônico),
    // tenta encontrar diretamente no mapa de nomes em inglês.
    // Isso cobre casos onde o DB retorna "Genesis" ou "1 Samuel" (já em inglês)
    const canonicalFromEnglishMap = englishNameMap.get(normalizedName);
    if (canonicalFromEnglishMap) {
        return canonicalFromEnglishMap;
    }

    // 5. Como último recurso, se o nome do DB já for um nome canônico em inglês, retorna ele mesmo.
    // Isso é para garantir que nomes como "Genesis" (se o DB já os tiver assim) sejam reconhecidos.
    if (bookNameTranslations.hasOwnProperty(dbBookName)) {
        return dbBookName;
    }
    
    return undefined;
}