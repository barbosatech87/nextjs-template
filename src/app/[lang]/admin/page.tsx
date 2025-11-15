import { Locale } from '@/lib/i18n/config';
import { getDashboardStats } from '@/app/actions/dashboard';
import { StatCard } from '@/components/admin/dashboard/stat-card';
import { QuickActions } from '@/components/admin/dashboard/quick-actions';
import { RecentDraftsCard } from '@/components/admin/dashboard/recent-drafts-card';
import { AnalyticsCard } from '@/components/admin/dashboard/analytics-card';
import { BookCopy, FileText, Users, Edit } from 'lucide-react';

interface AdminDashboardPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function AdminDashboardPage({ params }: AdminDashboardPageProps) {
  const { lang } = await params;
  const stats = await getDashboardStats();

  if (!stats) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Erro ao carregar o Dashboard</h1>
        <p className="text-muted-foreground">
          Não foi possível buscar as estatísticas. Tente novamente mais tarde.
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
            <QuickActions lang={lang} />
            <AnalyticsCard />
          </div>
        </div>
      </div>
    </div>
  );
}