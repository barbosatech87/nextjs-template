"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Locale } from '@/lib/i18n/config';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Share2, MessageCircle, Twitter, Facebook, Linkedin, Send, Mail, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareButtonsProps {
  title: string;
  summary: string | null;
  path: string; // Alterado de 'slug' para 'path'
  lang: Locale;
  className?: string;
}

const texts = {
  pt: {
    share: "Compartilhar",
    shareOn: "Compartilhar no",
    whatsApp: "WhatsApp",
    twitter: "Twitter / X",
    facebook: "Facebook",
    linkedin: "LinkedIn",
    telegram: "Telegram",
    email: "E-mail",
    copyLink: "Copiar link",
    linkCopied: "Link copiado para a área de transferência!",
    linkCopyError: "Falha ao copiar o link.",
  },
  en: {
    share: "Share",
    shareOn: "Share on",
    whatsApp: "WhatsApp",
    twitter: "Twitter / X",
    facebook: "Facebook",
    linkedin: "LinkedIn",
    telegram: "Telegram",
    email: "E-mail",
    copyLink: "Copy link",
    linkCopied: "Link copied to clipboard!",
    linkCopyError: "Failed to copy link.",
  },
  es: {
    share: "Compartir",
    shareOn: "Compartir en",
    whatsApp: "WhatsApp",
    twitter: "Twitter / X",
    facebook: "Facebook",
    linkedin: "LinkedIn",
    telegram: "Telegram",
    email: "E-mail",
    copyLink: "Copiar enlace",
    linkCopied: "¡Enlace copiado al portapapeles!",
    linkCopyError: "Error al copiar el enlace.",
  },
};

export function ShareButtons({ title, summary, path, lang, className }: ShareButtonsProps) {
  const isMobile = useIsMobile();
  const [isShareApiAvailable, setIsShareApiAvailable] = useState(false);
  const t = texts[lang] || texts.pt;

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setIsShareApiAvailable(true);
    }
  }, []);

  const shareUrl = `https://www.paxword.com/${lang}/${path}`;
  const shareText = `${title} - ${summary || ''}`;

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: title,
        text: shareText,
        url: shareUrl,
      });
    } catch (error) {
      console.log('Web Share API cancelado pelo usuário.', error);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(
      () => toast.success(t.linkCopied),
      () => toast.error(t.linkCopyError)
    );
  };

  const socialLinks = [
    { name: t.whatsApp, icon: <MessageCircle className="h-5 w-5" />, url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} - ${shareUrl}`)}` },
    { name: t.twitter, icon: <Twitter className="h-5 w-5" />, url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}` },
    { name: t.facebook, icon: <Facebook className="h-5 w-5" />, url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
    { name: t.linkedin, icon: <Linkedin className="h-5 w-5" />, url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary || '')}` },
    { name: t.telegram, icon: <Send className="h-5 w-5" />, url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}` },
    { name: t.email, icon: <Mail className="h-5 w-5" />, url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Confira este capítulo: ${shareUrl}`)}` },
  ];

  if (isMobile && isShareApiAvailable) {
    return (
      <div className={cn("flex justify-center", className)}>
        <Button onClick={handleNativeShare} size="lg" className="w-full max-w-xs">
          <Share2 className="mr-2 h-5 w-5" />
          {t.share}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center gap-2 flex-wrap", className)}>
      <span className="text-sm font-semibold mr-2">{t.share}:</span>
      <TooltipProvider>
        {socialLinks.map((social) => (
          <Tooltip key={social.name}>
            <TooltipTrigger asChild>
              <Button asChild variant="outline" size="icon">
                <a href={social.url} target="_blank" rel="noopener noreferrer" aria-label={`${t.shareOn} ${social.name}`}>
                  {social.icon}
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{`${t.shareOn} ${social.name}`}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={handleCopyLink} aria-label={t.copyLink}>
              <Link2 className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t.copyLink}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}