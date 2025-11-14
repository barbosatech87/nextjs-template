import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/integrations/supabase/server';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Locale } from '@/lib/i18n/config';
import { ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
  params: { lang: Locale };
}

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
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

  console.log(`User ID: ${user.id}, Role fetched: ${profile?.role}`);

  if (profile?.role !== 'admin' && profile?.role !== 'writer') {
    return redirect(`/${lang}`);
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar lang={lang}>
        <div className="p-4 sm:p-6 lg:p-8 w-full">
          {children}
        </div>
      </AdminSidebar>
    </div>
  );
}