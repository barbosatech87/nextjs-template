import { Locale } from '@/lib/i18n/config';
import { getDashboardStats } from '@/app/actions/dashboard';
import { StatCard } from '@/components/admin/dashboard/stat-card';
import { QuickActions } from '@/components/admin/dashboard/quick-actions';
import { RecentDraftsCard } from '@/components/admin/dashboard/recent-drafts-card';
import { AnalyticsCard } from '@/components/admin/dashboard/analytics-card';
import { BookCopy, FileText, Users, Edit } from 'lucide-react';
import { redirect } from 'next/navigation';

interface AdminDashboardPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function AdminDashboardPage({ params }: AdminDashboardPageProps) {
  const { lang } = await params;
  const stats = await getDashboardStats();

  if (!stats) {
    // Se falhar em carregar as estatísticas (provavelmente por auth), tenta redirecionar ou mostra erro
    // O Layout já deve ter redirecionado se não houver usuário, mas aqui garantimos.
    // Se o usuário estiver logado e for um erro real, ele verá a mensagem abaixo (ou será redirecionado se a sessão expirou)
    return (
      <div>
        <h1 className="text-3xl font-bold">Carregando...</h1>
        <p className="text-muted-foreground">
          Verificando permissões...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao painel de administração.
        </p>
      </div>

      <QuickActions lang={lang} />

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Posts Publicados"
            value={stats.publishedPosts}
            icon={<BookCopy className="h-4 w-4" />}
          />
          <StatCard 
            title="Rascunhos"
            value={stats.draftPosts}
            icon={<Edit className="h-4 w-4" />}
          />
          <StatCard 
            title="Usuários Totais"
            value={stats.totalUsers}
            icon={<Users className="h-4 w-4" />}
          />
          <StatCard 
            title="Páginas Públicas"
            value={stats.totalPages}
            icon={<FileText className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentDraftsCard drafts={stats.recentDrafts} lang={lang} />
          </div>
          <div className="space-y-6">
            <AnalyticsCard />
          </div>
        </div>
      </div>
    </div>
  );
}