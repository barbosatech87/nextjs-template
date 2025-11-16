import { Locale } from "@/lib/i18n/config";
import { getAdminUsers } from "@/app/actions/users";
import { UsersTable } from "@/components/admin/users/users-table";
import { InviteUserDialog } from "@/components/admin/users/invite-user-dialog";
import { ExportUsersButton } from "@/components/admin/users/export-users-button";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface ManageUsersPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function ManageUsersPage({ params }: ManageUsersPageProps) {
  const { lang } = await params;
  const users = await getAdminUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">
            Visualize, convide e gerencie os usuários da plataforma.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportUsersButton />
          <InviteUserDialog lang={lang}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Convidar Usuário
            </Button>
          </InviteUserDialog>
        </div>
      </div>
      <UsersTable users={users} lang={lang} />
    </div>
  );
}