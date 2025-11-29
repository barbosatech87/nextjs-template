import React from 'react';
import Link from 'next/link';
import { Locale } from '@/lib/i18n/config';
import { Facebook, Pinterest } from 'lucide-react';

interface FooterProps {
  lang: Locale;
}

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
        </div>
      </div>
    </footer>
  );
};

export default Footer;