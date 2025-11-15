import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Locale } from '@/lib/i18n/config';
import Link from 'next/link';
import { Edit } from 'lucide-react';

interface RecentDraftsCardProps {
  drafts: { id: string; title: string; updated_at: string }[];
  lang: Locale;
}

export function RecentDraftsCard({ drafts, lang }: RecentDraftsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rascunhos Recentes</CardTitle>
        <CardDescription>Posts que precisam de revisão ou finalização.</CardDescription>
      </CardHeader>
      <CardContent>
        {drafts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum rascunho encontrado.</p>
        ) : (
          <ul className="space-y-4">
            {drafts.map((draft) => (
              <li key={draft.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{draft.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Atualizado em {new Date(draft.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/${lang}/admin/blog/edit/${draft.id}`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}