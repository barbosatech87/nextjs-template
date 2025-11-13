import { LocalizedPageProps } from "@/types/next";

export default function ManageUsersPage({ params: { lang } }: LocalizedPageProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
      <p>Página para gerenciar usuários. (Em construção)</p>
    </div>
  );
}