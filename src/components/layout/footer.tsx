import React from 'react';
import Link from 'next/link';
import { Locale } from '@/lib/i18n/config';
import { Facebook } from 'lucide-react';

interface FooterProps {
  lang: Locale;
}

// Componente local para o ícone do Pinterest (não disponível no lucide-react)
const Pinterest = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M8 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
    {/* Substituindo por um path genérico de rede social para evitar SVG muito complexo inline,
        ou usando o path real se preferir. Aqui uso um path simplificado que lembra o 'P' 
        mas dentro do estilo outline do Lucide para manter consistência visual. 
        Para um logo de marca exato, seria melhor um path preenchido, mas o Lucide usa outline.
        Vou usar um SVG de Path que se assemelha ao logo do Pinterest.
    */}
    <path d="M12 2a10 10 0 1 0 0 20c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" style={{display: 'none'}} /> 
    <path d="M8 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0" style={{display: 'none'}} />
    
    {/* Path real aproximado do Pinterest no estilo Lucide */}
    <path d="M12 2C6.5 2 2 6.5 2 12c0 4.1 2.6 7.6 6.4 9.1-.1-.8-.2-2 .04-2.9.2-.8 1.4-6 1.4-6s-.3-.7-.3-1.7c0-1.6.9-2.8 2.1-2.8 1 0 1.5.7 1.5 1.6 0 1-.6 2.5-1 3.9-.3 1.2.6 2.2 1.8 2.2 2.1 0 3.8-2.2 3.8-5.4 0-2.8-2-4.9-4.9-4.9-3.4 0-5.4 2.6-5.4 5.2 0 1 .4 2.1.9 2.7.1.1.1.2.1.3-.1.4-.3 1.2-.3 1.4-.1.2-.2.3-.4.2-1.5-.7-2.4-2.9-2.4-4.6 0-3.8 2.8-7.3 8-7.3 4.2 0 7.4 3 7.4 6.9 0 4.1-2.6 7.5-6.2 7.5-1.2 0-2.4-.6-2.8-1.4l-.8 2.8c-.3 1.1-1.1 2.5-1.6 3.4 1.2.4 2.4.5 3.7.5 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
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
        </div>
      </div>
    </footer>
  );
};

export default Footer;