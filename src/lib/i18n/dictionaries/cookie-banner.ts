import { Locale } from '@/lib/i18n/config';

const dictionaries = {
  pt: {
    text1: "Nós utilizamos cookies para melhorar sua experiência e exibir anúncios personalizados. Ao continuar, você concorda com nossa ",
    privacyPolicy: "política de privacidade",
    text2: ".",
    acceptAll: "Aceitar Tudo",
    rejectNonEssential: "Rejeitar Opcionais",
    customize: "Personalizar",
  },
  en: {
    text1: "We use cookies to improve your experience and show personalized ads. By continuing, you agree to our ",
    privacyPolicy: "privacy policy",
    text2: ".",
    acceptAll: "Accept All",
    rejectNonEssential: "Reject Optional",
    customize: "Customize",
  },
  es: {
    text1: "Utilizamos cookies para mejorar tu experiencia y mostrar anuncios personalizados. Al continuar, aceptas nuestra ",
    privacyPolicy: "política de privacidad",
    text2: ".",
    acceptAll: "Aceptar todo",
    rejectNonEssential: "Rechazar opcionales",
    customize: "Personalizar",
  },
};

export const getCookieBannerDictionary = (lang: Locale) => dictionaries[lang] || dictionaries.pt;