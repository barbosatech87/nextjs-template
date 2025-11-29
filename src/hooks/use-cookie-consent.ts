"use client";

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'PAXWORD_COOKIE_CONSENT';

export interface ConsentSettings {
  necessary: boolean; // Sempre true
  analytics: boolean;
  marketing: boolean;
}

interface UseCookieConsentReturn {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  consent: ConsentSettings;
  updateConsent: (settings: Partial<ConsentSettings>) => void;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (settings: ConsentSettings) => void;
  hasReplied: boolean; // Indica se o usuário já fez uma escolha no passado
}

export function useCookieConsent(): UseCookieConsentReturn {
  // Estado inicial: nada permitido (exceto necessário), banner fechado até verificarmos o storage
  const [consent, setConsent] = useState<ConsentSettings>({
    necessary: true,
    analytics: false,
    marketing: false,
  });
  
  const [isOpen, setIsOpen] = useState(false);
  const [hasReplied, setHasReplied] = useState(false);

  useEffect(() => {
    // Verifica o localStorage apenas no lado do cliente
    const storedConsent = localStorage.getItem(STORAGE_KEY);

    if (storedConsent) {
      try {
        const parsed = JSON.parse(storedConsent);
        setConsent(parsed);
        setHasReplied(true);
        setIsOpen(false); // Já respondeu, não mostra banner
      } catch (e) {
        // Se houver erro no JSON, reseta
        setIsOpen(true);
      }
    } else {
      // Primeira visita: mostra o banner
      setIsOpen(true);
      setHasReplied(false);
    }
  }, []);

  const saveToStorage = (settings: ConsentSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setConsent(settings);
    setHasReplied(true);
    setIsOpen(false);
    
    // Opcional: Disparar um evento customizado se precisarmos notificar outros scripts imediatamente
    // window.dispatchEvent(new Event('cookie-consent-updated'));
  };

  const acceptAll = () => {
    saveToStorage({
      necessary: true,
      analytics: true,
      marketing: true,
    });
  };

  const rejectAll = () => {
    saveToStorage({
      necessary: true,
      analytics: false,
      marketing: false,
    });
  };

  const savePreferences = (settings: ConsentSettings) => {
    // Garante que necessário é sempre true
    saveToStorage({ ...settings, necessary: true });
  };

  const updateConsent = (settings: Partial<ConsentSettings>) => {
    setConsent((prev) => ({ ...prev, ...settings }));
  };

  return {
    isOpen,
    setIsOpen,
    consent,
    updateConsent,
    acceptAll,
    rejectAll,
    savePreferences,
    hasReplied,
  };
}