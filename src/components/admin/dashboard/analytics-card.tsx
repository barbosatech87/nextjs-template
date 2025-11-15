import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export function AnalyticsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Tráfego</CardTitle>
        <CardDescription>Acesse as estatísticas completas do seu site.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver no Google Analytics
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}