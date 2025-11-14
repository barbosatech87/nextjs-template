import { Locale } from '@/lib/i18n/config';
import ProfileFormWrapper from '@/components/profile/profile-form-wrapper';
import NotificationsList from '@/components/notifications/notifications-list';

interface ProfilePageProps {
  params: { lang: Locale };
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { lang } = params;
  return (
    <div className="container mx-auto max-w-4xl py-12">
      <h1 className="text-3xl font-bold mb-8">
        {lang === 'pt' ? 'Seu Perfil' : 'Your Profile'}
      </h1>
      <ProfileFormWrapper lang={lang} />
      <NotificationsList lang={lang} />
    </div>
  );
}