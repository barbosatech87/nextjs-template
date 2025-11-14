import { Locale } from "@/lib/i18n/config";

interface ManageUsersPageProps {
  params: { lang: Locale };
}

export default function ManageUsersPage({ params }: ManageUsersPageProps) {
  const { lang } = params;
  return (
    <div>
      <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
      <p>Página para gerenciar usuários. (Em construção)</p>
    </div>
  );
}