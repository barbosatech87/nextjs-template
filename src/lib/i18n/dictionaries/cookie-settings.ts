import { Locale } from '@/lib/i18n/config';

const dictionaries = {
  pt: {
    title: "Preferências de Cookies",
    description: "Gerencie suas preferências de privacidade. Cookies essenciais são necessários para o funcionamento do site.",
    necessary: {
      title: "Essenciais",
      desc: "Necessários para o site funcionar (login, segurança, preferências). Não podem ser desativados.",
    },
    analytics: {
      title: "Analíticos",
      desc: "Nos ajudam a entender como os visitantes interagem com o site, coletando métricas anônimas.",
    },
    marketing: {
      title: "Publicidade",
      desc: "Usados para exibir anúncios relevantes para você. Se desativado, você ainda verá anúncios, mas eles não serão baseados nos seus interesses (NPA).",
    },
    save: "Salvar Preferências",
    cancel: "Cancelar"
  },
  en: {
    title: "Cookie Preferences",
    description: "Manage your privacy preferences. Essential cookies are required for the site to function.",
    necessary: {
      title: "Essential",
      desc: "Required for the site to work (login, security, preferences). Cannot be disabled.",
    },
    analytics: {
      title: "Analytics",
      desc: "Help us understand how visitors interact with the website by collecting anonymous metrics.",
    },
    marketing: {
      title: "Marketing",
      desc: "Used to show ads relevant to you. If disabled, you will still see ads, but they won't be based on your interests (NPA).",
    },
    save: "Save Preferences",
    cancel: "Cancel"
  },
  es: {
    title: "Preferencias de Cookies",
    description: "Administra tus preferencias de privacidad. Las cookies esenciales son necesarias para el funcionamiento del sitio.",
    necessary: {
      title: "Esenciales",
      desc: "Necesarios para que el sitio funcione (inicio de sesión, seguridad, preferencias). No se pueden desactivar.",
    },
    analytics: {
      title: "Analíticas",
      desc: "Nos ayudan a entender cómo interactúan los visitantes con el sitio, recopilando métricas anónimas.",
    },
    marketing: {
      title: "Publicidad",
      desc: "Utilizados para mostrar anuncios relevantes para ti. Si se desactiva, seguirás viendo anuncios, pero no se basarán en tus intereses (NPA).",
    },
    save: "Guardar preferencias",
    cancel: "Cancelar"
  }
};

export const getCookieSettingsDictionary = (lang: Locale) => dictionaries[lang] || dictionaries.pt;