"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/auth/session-context-provider';
import { redirect } from 'next/navigation';
import { Locale } from '@/lib/i18n/config';
import { useEffect, use, useState } from 'react';

interface AuthPageProps {
  params: { lang: Locale };
}

export default function AuthPage({ params: paramsProp }: AuthPageProps) {
  const { lang } = use(paramsProp as any) as { lang: Locale };
  const { user, isLoading } = useSession();
  const [view, setView] = useState<'sign_in' | 'sign_up'>('sign_in');

  useEffect(() => {
    const handleHashChange = () => {
      const newView = window.location.hash.includes('sign-up') ? 'sign_up' : 'sign_in';
      setView(newView);
    };

    handleHashChange(); // Set initial view
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Redireciona usuários autenticados para a página inicial
  useEffect(() => {
    if (!isLoading && user) {
      redirect(`/${lang}`);
    }
  }, [user, isLoading, lang]);

  if (isLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  const titles = {
    pt: {
      sign_in: 'Acesse sua conta',
      sign_up: 'Cadastre-se',
    },
    en: {
      sign_in: 'Access your account',
      sign_up: 'Sign Up',
    },
    es: {
      sign_in: 'Accede a tu cuenta',
      sign_up: 'Regístrate',
    },
  };

  const currentTitle = titles[lang]?.[view] || titles.pt[view];

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted p-4">
      <div className="w-full max-w-md p-8 bg-background shadow-lg rounded-lg border">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {currentTitle}
        </h1>
        <Auth
          supabaseClient={supabase}
          view={view}
          providers={[]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                },
              },
            },
          }}
          theme="light"
          localization={{
            variables: {
              sign_in: {
                email_label: lang === 'pt' ? 'Seu email' : 'Your email',
                password_label: lang === 'pt' ? 'Sua senha' : 'Your password',
                button_label: lang === 'pt' ? 'Entrar' : 'Sign In',
                social_provider_text: lang === 'pt' ? 'Entrar com {{provider}}' : 'Sign in with {{provider}}',
                link_text: lang === 'pt' ? 'Não tem uma conta? Cadastrar' : 'Don\'t have an account? Sign Up',
              },
              sign_up: {
                email_label: lang === 'pt' ? 'Seu email' : 'Your email',
                password_label: lang === 'pt' ? 'Crie uma senha' : 'Create a password',
                button_label: lang === 'pt' ? 'Cadastrar' : 'Sign Up',
                social_provider_text: lang === 'pt' ? 'Cadastrar com {{provider}}' : 'Sign up with {{provider}}',
                link_text: lang === 'pt' ? 'Já tem uma conta? Entrar' : 'Already have an account? Sign In',
              },
              forgotten_password: {
                link_text: lang === 'pt' ? 'Esqueceu sua senha?' : 'Forgot your password?',
              },
            },
          }}
        />
      </div>
    </div>
  );
}