import { Locale } from './i18n/config';

interface BookTranslations {
  pt: string;
  es: string;
  englishAliases?: string[];
}

const bookNameTranslations: Record<string, BookTranslations> = {
  // Antigo Testamento
  "Genesis": { "pt": "Gênesis", "es": "Génesis" },
  "Exodus": { "pt": "Êxodo", "es": "Éxodo" },
  "Leviticus": { "pt": "Levítico", "es": "Levítico" },
  "Numbers": { "pt": "Números", "es": "Números" },
  "Deuteronomy": { "pt": "Deuteronômio", "es": "Deuteronomio" },
  "Joshua": { "pt": "Josué", "es": "Josué" },
  "Judges": { "pt": "Juízes", "es": "Jueces" },
  "Ruth": { "pt": "Rute", "es": "Rut" },
  "I Samuel": { "pt": "1 Samuel", "es": "1 Samuel", englishAliases: ["1 Samuel"] },
  "II Samuel": { "pt": "2 Samuel", "es": "2 Samuel", englishAliases: ["2 Samuel"] },
  "I Kings": { "pt": "1 Reis", "es": "1 Reyes", englishAliases: ["1 Kings"] },
  "II Kings": { "pt": "2 Reis", "es": "2 Reyes", englishAliases: ["2 Kings"] },
  "I Chronicles": { "pt": "1 Crônicas", "es": "1 Crónicas", englishAliases: ["1 Chronicles"] },
  "II Chronicles": { "pt": "2 Crônicas", "es": "2 Crónicas", englishAliases: ["2 Chronicles"] },
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
  "I Corinthians": { "pt": "1 Coríntios", "es": "1 Corintios", englishAliases: ["1 Corinthians"] },
  "II Corinthians": { "pt": "2 Coríntios", "es": "2 Corintios", englishAliases: ["2 Corinthians"] },
  "Galatians": { "pt": "Gálatas", "es": "Gálatas" },
  "Ephesians": { "pt": "Efésios", "es": "Efesios" },
  "Philippians": { "pt": "Filipenses", "es": "Filipenses" },
  "Colossians": { "pt": "Colossenses", "es": "Colosenses" },
  "I Thessalonians": { "pt": "1 Tessalonicenses", "es": "1 Tesalonicenses", englishAliases: ["1 Thessalonians"] },
  "II Thessalonians": { "pt": "2 Tessalonicenses", "es": "2 Tesalonicenses", englishAliases: ["2 Thessalonians"] },
  "I Timothy": { "pt": "1 Timóteo", "es": "1 Timoteo", englishAliases: ["1 Timothy"] },
  "II Timothy": { "pt": "2 Timóteo", "es": "2 Timoteo", englishAliases: ["2 Timothy"] },
  "Titus": { "pt": "Tito", "es": "Tito" },
  "Philemon": { "pt": "Filemom", "es": "Filemón" },
  "Hebrews": { "pt": "Hebreus", "es": "Hebreos" },
  "James": { "pt": "Tiago", "es": "Santiago" },
  "I Peter": { "pt": "1 Pedro", "es": "1 Pedro", englishAliases: ["1 Peter"] },
  "II Peter": { "pt": "2 Pedro", "es": "2 Pedro", englishAliases: ["2 Peter"] },
  "I John": { "pt": "1 João", "es": "1 Juan", englishAliases: ["1 John"] },
  "II John": { "pt": "2 João", "es": "2 Juan", englishAliases: ["2 John"] },
  "III John": { "pt": "3 João", "es": "3 Juan", englishAliases: ["3 John"] },
  "Jude": { "pt": "Judas", "es": "Judas" },
  "Revelation of John": { "pt": "Apocalipse", "es": "Apocalipsis", englishAliases: ["Revelation"] },
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

export function getBookNameFromSlug(slug: string): string | undefined {
    // Reconstroi o nome do livro a partir do slug (ex: "1-samuel" -> "1 Samuel")
    const formattedSlug = slug.split('-').map(word => {
        // Trata casos como "1" ou "2" no início do slug
        if (word.match(/^\d+$/)) {
            return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');

    // Normaliza o nome formatado do slug
    const normalizedSlugName = normalizeName(formattedSlug);

    // Tenta encontrar o nome canônico em inglês a partir do nome normalizado do slug,
    // verificando o nome em inglês, seus aliases e suas traduções.
    for (const englishCanonicalName in bookNameTranslations) {
        const bookData = bookNameTranslations[englishCanonicalName];

        // 1. Verifica o nome canônico em inglês
        if (normalizeName(englishCanonicalName) === normalizedSlugName) {
            return englishCanonicalName;
        }

        // 2. Verifica os aliases em inglês
        if (bookData.englishAliases) {
            for (const alias of bookData.englishAliases) {
                if (normalizeName(alias) === normalizedSlugName) {
                    return englishCanonicalName;
                }
            }
        }

        // 3. Verifica a tradução em português
        if (bookData.pt && normalizeName(bookData.pt) === normalizedSlugName) {
            return englishCanonicalName;
        }

        // 4. Verifica a tradução em espanhol
        if (bookData.es && normalizeName(bookData.es) === normalizedSlugName) {
            return englishCanonicalName;
        }
    }
    return undefined;
}

export function getTranslatedBookName(englishName: string, lang: Locale): string {
  if (lang === 'en') {
    // Para inglês, retorna o nome canônico ou o primeiro alias se existir (ex: "1 Kings" em vez de "I Kings")
    const bookData = bookNameTranslations[englishName as keyof typeof bookNameTranslations];
    return bookData?.englishAliases?.[0] || englishName;
  }
  
  // Busca a tradução usando a chave canônica (com algarismo romano)
  const translated = bookNameTranslations[englishName as keyof typeof bookNameTranslations]?.[lang as 'pt' | 'es'];
  
  // Retorna a tradução ou o nome original em inglês como fallback
  return translated || englishName;
}

export function getEnglishBookName(dbBookName: string, lang: Locale): string | undefined {
    // 1. Normaliza o nome do livro vindo do banco de dados, convertendo romanos para arábicos
    const normalizedInput = normalizeName(convertRomanToArabic(dbBookName));

    // 2. Itera por todos os nomes canônicos em inglês e suas traduções/aliases
    for (const englishCanonicalName in bookNameTranslations) {
        const bookData = bookNameTranslations[englishCanonicalName];

        // Verifica se o input normalizado corresponde ao nome canônico em inglês (normalizado)
        if (normalizeName(englishCanonicalName) === normalizedInput) {
            return englishCanonicalName;
        }

        // Verifica se o input normalizado corresponde a algum alias em inglês
        if (bookData.englishAliases) {
            for (const alias of bookData.englishAliases) {
                if (normalizeName(alias) === normalizedInput) {
                    return englishCanonicalName;
                }
            }
        }

        // Verifica se o input normalizado corresponde à tradução em português (normalizada)
        if (bookData.pt && normalizeName(bookData.pt) === normalizedInput) {
            return englishCanonicalName;
        }

        // Verifica se o input normalizado corresponde à tradução em espanhol (normalizada)
        if (bookData.es && normalizeName(bookData.es) === normalizedInput) {
            return englishCanonicalName;
        }
    }
    
    // Se nenhuma correspondência for encontrada, retorna undefined
    return undefined;
}