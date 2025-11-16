import { ReactNode } from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Locale } from '@/lib/i18n/config';
import { createSupabaseServerClient } from '@/integrations/supabase/server';
import SafeRedirect from '@/components/navigation/safe-redirect';

interface AdminLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: Locale }>;
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { lang } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAuthorized = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    // Permite que admins e writers acessem o painel
    isAuthorized = profile?.role === 'admin' || profile?.role === 'writer';
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar lang={lang}>
        <div className="p-6 bg-muted/40 h-full">
          {isAuthorized ? children : <SafeRedirect href={`/${lang}/auth`} />}
        </div>
      </AdminSidebar>
    </div>
  );
}