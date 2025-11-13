import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { redirect } from "next/navigation";
import ProfileFormWrapper from "@/components/profile/profile-form-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PasswordChangeForm from "@/components/profile/password-change-form";
import { Locale } from "@/lib/i18n/config";
import { AppPageProps } from "@/types/app";

const texts = {
  pt: {
    title: "Meu Perfil",
    loading: "Carregando perfil...",
    unauthorized: "Acesso negado. Faça login para ver seu perfil.",
    passwordChangeTitle: "Alterar Senha",
  },
  en: {
    title: "My Profile",
    loading: "Loading profile...",
    unauthorized: "Access denied. Please log in to view your profile.",
    passwordChangeTitle: "Change Password",
  },
  es: {
    title: "Mi Perfil",
    loading: "Cargando perfil...",
    unauthorized: "Acceso denegado. Inicia sesión para ver tu perfil.",
    passwordChangeTitle: "Cambiar Contraseña",
  },
};

export default async function ProfilePage({ params }: AppPageProps<{ lang: Locale }>) {
  const { lang } = params;
  const t = texts[lang as keyof typeof texts] || texts.pt;
  
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${lang}/auth`);
  }

  return (
    <>
      <Header lang={lang} />
      <div className="flex-grow container px-4 md:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">{t.title}</h1>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileFormWrapper lang={lang} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.passwordChangeTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <PasswordChangeForm lang={lang} />
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer lang={lang} />
    </>
  );
}