"use client";

import React from 'react';
import { useProfile } from '@/hooks/use-profile';
import { Locale } from '@/lib/i18n/config';
import ProfileForm from './profile-form';
import { Skeleton } from '@/components/ui/skeleton';

interface ProfileFormWrapperProps {
  lang: Locale;
}

const texts = {
  pt: {
    loading: "Carregando perfil...",
  },
  en: {
    loading: "Loading profile...",
  },
  es: {
    loading: "Cargando perfil...",
  },
};

const ProfileFormWrapper: React.FC<ProfileFormWrapperProps> = ({ lang }) => {
  const { profile, isLoading } = useProfile();
  const t = texts[lang] || texts.pt;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  return <ProfileForm lang={lang} initialProfile={profile} />;
};

export default ProfileFormWrapper;