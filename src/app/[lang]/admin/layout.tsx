import { ReactNode } from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Locale } from '@/lib/i18n/config';
import { createSupabaseServerClient } from '@/integrations/supabase/server';
import { redirect } from 'next/navigation';

interface AdminLayoutProps {
  children: ReactNode;
  params: { lang: Locale };
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { lang } = params;
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect(`/${lang}/auth`);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return redirect(`/${lang}`);
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar lang={lang} />
      <main className="flex-1 p-6 bg-muted/40">{children}</main>
    </div>
  );