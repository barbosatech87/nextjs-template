"use client";

import { useEffect } from 'react';
import { Locale } from '@/lib/i18n/config';

interface LangSetterProps {
  lang: Locale;
}

export function LangSetter({ lang }: LangSetterProps) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return null;
}