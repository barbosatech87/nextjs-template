import { use } from "react";
import { Locale } from "@/lib/i18n/config";

export default function ManageUsersPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = use(params);
  return (
    <div>
      <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
      <p>Página para gerenciar usuários. (Em construção)</p>
    </div>
  );
}