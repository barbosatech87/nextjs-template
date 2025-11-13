import { Locale } from "@/lib/i18n/config";
import { AppPageProps } from "@/types/app";

export default function ManageUsersPage({ params }: AppPageProps<{ lang: Locale }>) {
  const { lang } = params;
  return (
    <div>
      <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
      <p>Página para gerenciar usuários. (Em construção)</p>
    </div>
  );
}