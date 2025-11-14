import React from 'react';
import { Locale } from '@/lib/i18n/config';

interface FooterProps {
  lang: Locale;
}

// Simulação de textos de rodapé
const footerTexts = {
  pt: {
    copyright: "© 2024 PaxWord. Todos os direitos reservados.",
    links: {
      privacy: "Política de Privacidade",
      terms: "Termos de Serviço",
      contact: "Contato",
    }
  },
  en: {
    copyright: "© 2024 PaxWord. All rights reserved.",
    links: {
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      contact: "Contact",
    }
  },
  es: {
    copyright: "© 2024 PaxWord. Todos los derechos reservados.",
    links: {
      privacy: "Política de Privacidad",
      terms: "Términos de Servicio",
      contact: "Contacto",
    }
  },
};

const Footer: React.FC<FooterProps> = ({ lang }) => {
  const texts = footerTexts[lang] || footerTexts.pt;

  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container px-4 md:px-8 py-6 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
        <p className="text-center md:text-left mb-2 md:mb-0">
          {texts.copyright}
        </p>
        <div className="flex space-x-4">
          <a href={`/${lang}/privacy`} className="hover:text-primary transition-colors">
            {texts.links.privacy}
          </a>
          <a href={`/${lang}/terms`} className="hover:text-primary transition-colors">
            {texts.links.terms}
          </a>
          <a href={`/${lang}/contact`} className="hover:text-primary transition-colors">
            {texts.links.contact}
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;