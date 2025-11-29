import React from 'react';
import Link from 'next/link';
import { Locale } from '@/lib/i18n/config';
import { Facebook } from 'lucide-react';

interface FooterProps {
  lang: Locale;
}

// Ícone oficial do Pinterest (Brand Logo)
// Usamos fill="currentColor" e stroke="none" para renderizar a forma sólida correta
const Pinterest = ({ className }: { className?: string }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    stroke="none"
    className={className}
  >
    <title>Pinterest</title>
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.651 0-5.789 2.722-5.789 5.563 0 1.103.425 2.278.953 2.92.106.133.122.247.09.44-.096.412-.325 1.305-.369 1.483-.06.25-.197.299-.452.185-1.678-.775-2.724-3.212-2.724-5.163 0-3.847 2.793-7.387 8.053-7.387 4.232 0 7.518 3.018 7.518 7.054 0 4.212-2.654 7.601-6.338 7.601-1.238 0-2.4-.643-2.797-1.402l-.762 2.9c-.273 1.047-1.01 2.358-1.503 3.161 1.134.336 2.339.52 3.583.52 6.61 0 11.968-5.361 11.968-11.974 0-6.62-5.358-11.987-11.968-11.987z" />
  </svg>
);

// Ícone RSS Feed SVG
const RssIcon = ({ className }: { className?: string }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    stroke="none"
    className={className}
  >
    <title>RSS Feed</title>
    <path d="M19.199 24C19.199 13.439 10.561 4.8 0 4.8V0c13.253 0 24 10.747 24 24h-4.801zM3.291 17.415c1.814 0 3.293 1.479 3.293 3.295 0 1.813-1.485 3.29-3.301 3.29C1.47 24 0 22.526 0 20.71s1.475-3.294 3.291-3.295zM15.909 24h-4.63c0-6.226-5.043-11.271-11.279-11.271V8.099c8.783 0 15.909 7.124 15.909 15.901z" />
  </svg>
);

// Textos do rodapé atualizados
const footerTexts = {
  pt: {
    copyright: "© 2024 PaxWord. Todos os direitos reservados.",
    links: {
      privacy: "Política de Privacidade",
      terms: "Termos de Serviço",
      about: "Sobre Nós",
      contact: "Contato",
    }
  },
  en: {
    copyright: "© 2024 PaxWord. All rights reserved.",
    links: {
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      about: "About Us",
      contact: "Contact",
    }
  },
  es: {
    copyright: "© 2024 PaxWord. Todos os direitos reservados.",
    links: {
      privacy: "Política de Privacidad",
      terms: "Términos de Servicio",
      about: "Sobre Nosotros",
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
        <div className="flex items-center flex-wrap justify-center gap-4">
          <Link href={`/${lang}/p/politica-de-privacidade`} className="hover:text-primary transition-colors">
            {texts.links.privacy}
          </Link>
          <Link href={`/${lang}/p/termos-de-servico-paxword`} className="hover:text-primary transition-colors">
            {texts.links.terms}
          </Link>
          <Link href={`/${lang}/p/sobre-nos`} className="hover:text-primary transition-colors">
            {texts.links.about}
          </Link>
          <Link href={`/${lang}/p/contato`} className="hover:text-primary transition-colors">
            {texts.links.contact}
          </Link>
          <a href="https://www.facebook.com/paxwordofficial" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <Facebook className="h-5 w-5 hover:text-primary transition-colors" />
          </a>
          <a href="https://pinterest.com/paxwordofficial/" target="_blank" rel="noopener noreferrer" aria-label="Pinterest">
            <Pinterest className="h-5 w-5 hover:text-primary transition-colors" />
          </a>
          <Link href={`/${lang}/p/rss-feed`} aria-label="RSS Feed">
            <RssIcon className="h-5 w-5 hover:text-primary transition-colors" />
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;