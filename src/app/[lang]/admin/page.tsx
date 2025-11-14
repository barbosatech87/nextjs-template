import { Locale } from "@/lib/i18n/config";

const texts = {
  pt: {
    title: "Painel Administrativo",
    welcome: "Bem-vindo ao painel de administração. Use a barra lateral para navegar.",
  },
  en: {
    title: "Admin Dashboard",
    welcome: "Welcome to the admin panel. Use the sidebar to navigate.",
  },
  es: {
    title: "Panel de Administración",
    welcome: "Bienvenido al panel de administración. Utilice la barra lateral para navegar.",
  },
};

interface AdminDashboardPageProps {
  params: Awaited<{ lang: Locale }>;
}

export default async function AdminDashboardPage({ params }: AdminDashboardPageProps) {
  const { lang } = params;
  const t = texts[lang as keyof typeof texts] || texts.pt;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t.title}</h1>
      <p>{t.welcome}</p>
    </div>
  );
}