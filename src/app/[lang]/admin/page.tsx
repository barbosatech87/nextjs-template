import { Locale } from '@/lib/i18n/config';

interface AdminDashboardPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function AdminDashboardPage({ params }: AdminDashboardPageProps) {
  const { lang } = await params;
  return (
    <div>
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p className="text-muted-foreground">
        {lang === 'pt' ? 'Bem-vindo ao painel de administração.' : 'Welcome to the admin dashboard.'}
      </p>
    </div>
  );
}