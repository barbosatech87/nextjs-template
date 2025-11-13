import { use } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/integrations/supabase/server';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { LocalizedLayoutProps } from '@/types/next';

export default async function AdminLayout({
  children,
  params,
}: LocalizedLayoutProps) {
  const { lang } = use(params);
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

  // Adicionando log de depuração
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