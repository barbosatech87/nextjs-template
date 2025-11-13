"use client";

import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Locale } from "@/lib/i18n/config";
import { useSession } from "@/components/auth/session-context-provider";
import { redirect } from "next/navigation";
import { useProfile } from "@/hooks/use-profile";
import ProfileForm from "@/components/profile/profile-form";
import PasswordChangeForm from "@/components/profile/password-change-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const texts = {
  pt: {
    title: "Meu Perfil",
    loading: "Carregando perfil...",
    unauthorized: "Acesso negado. Faça login para ver seu perfil.",
  },
  en: {
    title: "My Profile",
    loading: "Loading profile...",
    unauthorized: "Access denied. Please log in to view your profile.",
  },
  es: {
    title: "Mi Perfil",
    loading: "Cargando perfil...",
    unauthorized: "Acceso denegado. Inicia sesión para ver tu perfil.",
  },
};

export default function ProfilePage({ params: { lang } }: { params: { lang: Locale } }) {
  const { user, isLoading: isSessionLoading } = useSession();
  const { profile, isLoading: isProfileLoading } = useProfile();
  const t = texts[lang] || texts.pt;

  // 1. Redirecionar se não estiver logado
  if (!isSessionLoading && !user) {
    redirect(`/${lang}/auth`);
    return null;
  }

  const isLoading = isSessionLoading || isProfileLoading;

  return (
    <>
      <Header lang={lang} />
      <div className="flex-grow container px-4 md:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">{t.title}</h1>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-10 w-32" />
            <Separator className="my-8" />
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-10 w-32" />
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileForm lang={lang} initialProfile={profile} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{texts.pt.title}</CardTitle> {/* Reusing title for card */}
              </CardHeader>
              <CardContent>
                <PasswordChangeForm lang={lang} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <Footer lang={lang} />
    </>
  );
}