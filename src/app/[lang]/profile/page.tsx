import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { redirect } from "next/navigation";
import ProfileFormWrapper from "@/components/profile/profile-form-wrapper"; // Novo wrapper
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PasswordChangeForm from "@/components/profile/password-change-form";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalizedPageProps } from "@/types/next";

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

// Componente Wrapper para lidar com o estado do perfil no cliente
// Isso permite que a página principal seja um Server Component
// e resolve o problema de use(params)
// O componente ProfileFormWrapper será criado abaixo.

export default async function ProfilePage({ params }: LocalizedPageProps) {
  const { lang } = params;
  const t = texts[lang] || texts.pt;
  
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Redirecionar se não estiver logado
  if (!user) {
    redirect(`/${lang}/auth`);
  }

  // Não precisamos buscar o perfil aqui, pois o useProfile fará isso no cliente.
  // Apenas garantimos que o usuário está logado.

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
              {/* O ProfileFormWrapper lida com o carregamento e o estado do perfil no cliente */}
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