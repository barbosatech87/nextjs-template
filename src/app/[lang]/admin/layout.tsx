import { ReactNode } from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Locale } from '@/lib/i18n/config';
import { createSupabaseServerClient } from '@/integrations/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

interface AdminLayoutProps {
  children: ReactNode;
  params: { lang: Locale };
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { lang } = params;

  // Detecta chamadas de Server Actions (POST interno do Next)
  const hdrs = headers();
  const isServerActionRequest = Boolean(
    hdrs.get('next-action') ||
    hdrs.get('Next-Action') ||
    hdrs.get('rsc-action') ||
    hdrs.get('RSC-Action')
  );

  // Durante Server Actions, não fazer redirects, mas manter o layout com Sidebar.
  if (isServerActionRequest) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar lang={lang}>
          <div className="p-6 bg-muted/40 h-full">{children}</div>
        </AdminSidebar>
      </div>
    );
  }

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
      <AdminSidebar lang={lang}>
        <div className="p-6 bg-muted/40 h-full">{children}</div>
      </AdminSidebar>
    </div>
  );
}