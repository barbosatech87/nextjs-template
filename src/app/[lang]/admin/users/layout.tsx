import { ReactNode } from 'react';
import { Locale } from '@/lib/i18n/config';
import { createSupabaseServerClient } from '@/integrations/supabase/server';
import { redirect } from 'next/navigation';

interface AdminSectionLayoutProps {
  children: ReactNode;
  params: { lang: Locale };
}

export default async function AdminUsersLayout({ children, params }: AdminSectionLayoutProps) {
  const { lang } = params;
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'admin') {
      return <>{children}</>;
    }
  }

  // Redireciona não-admins para o painel principal
  redirect(`/${lang}/admin`);
}