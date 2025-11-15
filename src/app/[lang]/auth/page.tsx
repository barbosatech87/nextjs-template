"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/auth/session-context-provider';
import { useRouter, useParams } from 'next/navigation';
import { Locale } from '@/lib/i18n/config';
import { useEffect, useState } from 'react';
import SignUpForm from '@/components/auth/sign-up-form';

interface AuthPageProps {
  params: { lang: Locale };
}

export default function AuthPage() {
  const { lang: langParam } = useParams() as { lang: import('@/lib/i18n/config').Locale };
  const lang = langParam ?? 'pt';
  const router = useRouter();
  const { user, isLoading } = useSession();
  const [view, setView] = useState<'sign_in' | 'sign_up' | 'forgotten_password'>('sign_in');

  // Detecta a view pelo hash da URL (suporta vários formatos)
  useEffect(() => {
    const detectViewFromHash = () => {
      const hash = window.location.hash.toLowerCase();
      const isSignUp =
        hash.includes('sign-up') ||
        hash.includes('signup') ||
        hash.includes('sign_up');
      const isSignIn =
        hash.includes('sign-in') ||
        hash.includes('signin') ||
        hash.includes('sign_in');
      const isForgot =
        hash.includes('forgot') ||
        hash.includes('forgot-password') ||
        hash.includes('forgotten_password');

      if (isSignUp) {
        setView('sign_up');
      } else if (isSignIn) {
        setView('sign_in');
      } else if (isForgot) {
        setView('forgotten_password');
      } else {
        setView('sign_in'); // padrão
      }
    };

    detectViewFromHash();
    window.addEventListener('hashchange', detectViewFromHash);
    return () => window.removeEventListener('hashchange', detectViewFromHash);
  }, []);

  // Redireciona usuários autenticados para a página inicial (client-safe)
  useEffect(() => {
    if (!isLoading && user) {
      router.replace(`/${lang}`);
    }
  }, [user, isLoading, lang, router]);

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
      sign_up: 'Crie sua conta',
      forgotten_password: 'Recupere sua senha',
    },
    en: {
      sign_in: 'Access your account',
      sign_up: 'Create your account',
      forgotten_password: 'Recover your password',
    },
    es: {
      sign_in: 'Accede a tu cuenta',
      sign_up: 'Crea tu cuenta',
      forgotten_password: 'Recupera tu contraseña',
    },
  };

  const currentTitle = titles[lang]?.[view] || titles.pt[view];

  // Seletor simples para alternar entre Entrar/Cadastrar e sincronizar com o Auth
  const handleSelectView = (nextView: 'sign_in' | 'sign_up' | 'forgotten_password') => {
    setView(nextView);
    // atualiza o hash para manter o Auth em sincronia
    window.location.hash =
      nextView === 'sign_in'
        ? 'sign-in'
        : nextView === 'sign_up'
        ? 'sign-up'
        : 'forgot-password';
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted p-4">
      <div className="w-full max-w-md p-8 bg-background shadow-lg rounded-lg border">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {currentTitle}
        </h1>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleSelectView('sign_in')}
            className={`px-3 py-2 rounded-md text-sm font-medium border ${
              view === 'sign_in'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted text-muted-foreground border-muted-foreground/20'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => handleSelectView('sign_up')}
            className={`px-3 py-2 rounded-md text-sm font-medium border ${
              view === 'sign_up'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted text-muted-foreground border-muted-foreground/20'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {view === 'sign_up' ? (
          <SignUpForm lang={lang} onSwitchToSignIn={() => handleSelectView('sign_in')} />
        ) : (
          <Auth
            supabaseClient={supabase}
            view={view}
            providers={[]}
            showLinks={false}
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
            },
            theme="light"
            localization={{
              variables: {
                sign_in: {
                  email_label: lang === 'pt' ? 'Seu email' : 'Your email',
                  password_label: lang === 'pt' ? 'Sua senha' : 'Your password',
                  button_label: lang === 'pt' ? 'Entrar' : 'Sign In',
                  social_provider_text:
                    lang === 'pt' ? 'Entrar com {{provider}}' : 'Sign in with {{provider}}',
                },
                forgotten_password: {
                  link_text: lang === 'pt' ? 'Esqueceu sua senha?' : 'Forgot your password?',
                },
              },
            }}
          />
        )}

        {/* Links personalizados abaixo do formulário */}
        <div className="mt-4 text-center text-sm space-y-2">
          {view === 'sign_in' && (
            <>
              <button
                type="button"
                onClick={() => handleSelectView('forgotten_password')}
                className="text-muted-foreground hover:text-foreground underline"
              >
                {lang === 'pt'
                  ? 'Esqueceu sua senha?'
                  : lang === 'es'
                  ? '¿Olvidaste tu contraseña?'
                  : 'Forgot your password?'}
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => handleSelectView('sign_up')}
                  className="text-muted-foreground hover:text-foreground underline"
                >
                  {lang === 'pt'
                    ? 'Não tem uma conta? Cadastre-se'
                    : lang === 'es'
                    ? '¿No tienes una cuenta? Regístrate'
                    : "Don't have an account? Sign up"}
                </button>
              </div>
            </>
          )}
          {view === 'sign_up' && (
            <button
              type="button"
              onClick={() => handleSelectView('sign_in')}
              className="text-muted-foreground hover:text-foreground underline"
            >
              {lang === 'pt'
                ? 'Já tem uma conta? Entre'
                : lang === 'es'
                ? '¿Ya tienes una cuenta? Inicia sesión'
                : 'Already have an account? Sign in'}
            </button>
          )}
          {view === 'forgotten_password' && (
            <button
              type="button"
              onClick={() => handleSelectView('sign_in')}
              className="text-muted-foreground hover:text-foreground underline"
            >
              {lang === 'pt'
                ? 'Voltar para entrar'
                : lang === 'es'
                ? 'Volver a iniciar sesión'
                : 'Back to sign in'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}