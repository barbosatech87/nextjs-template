import { ReactNode } from 'react';
import { Locale } from '@/lib/i18n/config';
import { createSupabaseServerClient } from '@/integrations/supabase/server';
import { redirect } from 'next/navigation';

interface AdminSectionLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: Locale }>;
}

export default async function AdminReadingPlansLayout({ children, params }: AdminSectionLayoutProps) {
  const { lang } = await params;
  const supabase = await createSupabaseServerClient();
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

  redirect(`/${lang}/admin`);
}