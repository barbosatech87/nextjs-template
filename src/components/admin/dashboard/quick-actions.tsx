import { Button } from '@/components/ui/button';
import { Locale } from '@/lib/i18n/config';
import { FileText, PlusCircle, UserPlus, Clock } from 'lucide-react';
import Link from 'next/link';

interface QuickActionsProps {
  lang: Locale;
}

export function QuickActions({ lang }: QuickActionsProps) {
  const actions = [
    { href: `/${lang}/admin/blog/new`, label: 'Novo Post', icon: <PlusCircle className="h-4 w-4" /> },
    { href: `/${lang}/admin/pages/new`, label: 'Nova Página', icon: <FileText className="h-4 w-4" /> },
    { href: `/${lang}/admin/users`, label: 'Convidar Usuário', icon: <UserPlus className="h-4 w-4" /> },
    { href: `/${lang}/admin/schedules`, label: 'Agendamentos', icon: <Clock className="h-4 w-4" /> },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Button key={action.href} asChild variant="outline">
          <Link href={action.href} className="flex items-center justify-center gap-2">
            {action.icon}
            <span className="hidden sm:inline">{action.label}</span>
            <span className="sm:hidden">{action.label.split(' ')[0]}</span>
          </Link>
        </Button>
      ))}
    </div>
  );
}