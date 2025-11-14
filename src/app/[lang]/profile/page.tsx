import { Locale } from '@/lib/i18n/config';
import NotificationsList from '@/components/notifications/notifications-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Heart, Bell, FileText } from 'lucide-react';
import { UserDataTab } from '@/components/profile/user-data-tab';
import { FavoritesTab } from '@/components/profile/favorites-tab';
import { NotesTab } from '@/components/profile/notes-tab';
import { getHydratedFavorites } from '@/app/actions/favorites';

interface ProfilePageProps {
  params: { lang: Locale };
}

const pageTexts = {
  pt: {
    title: 'Seu Perfil',
    tabData: 'Dados do Usuário',
    tabFavorites: 'Favoritos',
    tabNotifications: 'Notificações',
    tabNotes: 'Anotações',
  },
  en: {
    title: 'Your Profile',
    tabData: 'User Data',
    tabFavorites: 'Favorites',
    tabNotifications: 'Notifications',
    tabNotes: 'Notes',
  },
  es: {
    title: 'Tu Perfil',
    tabData: 'Datos de Usuario',
    tabFavorites: 'Favoritos',
    tabNotifications: 'Notificaciones',
    tabNotes: 'Anotaciones',
  },
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { lang } = params;
  const t = pageTexts[lang] || pageTexts.pt;

  const favorites = await getHydratedFavorites();

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <h1 className="text-3xl font-bold mb-8">{t.title}</h1>
      
      <Tabs defaultValue="data" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="data" className="flex items-center gap-2 py-2">
            <User className="h-4 w-4" />
            {t.tabData}
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center gap-2 py-2">
            <Heart className="h-4 w-4" />
            {t.tabFavorites}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 py-2">
            <Bell className="h-4 w-4" />
            {t.tabNotifications}
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2 py-2">
            <FileText className="h-4 w-4" />
            {t.tabNotes}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="data" className="mt-6">
          <UserDataTab lang={lang} />
        </TabsContent>
        
        <TabsContent value="favorites" className="mt-6">
          <FavoritesTab lang={lang} favorites={favorites} />
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-6">
          <NotificationsList lang={lang} />
        </TabsContent>
        
        <TabsContent value="notes" className="mt-6">
          <NotesTab lang={lang} />
        </TabsContent>
      </Tabs>
    </div>
  );
}