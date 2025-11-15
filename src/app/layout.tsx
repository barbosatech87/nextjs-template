import { ReactNode } from 'react';
import { SessionContextProvider } from '@/components/auth/session-context-provider';
import { Toaster } from '@/components/ui/sonner';
import GoogleAnalytics from '@/components/analytics/google-analytics';
import './globals.css';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    // O atributo lang será definido no layout [lang]
    <html suppressHydrationWarning>
      <body>
        <SessionContextProvider>
          <GoogleAnalytics />
          {children}
          <Toaster />
        </SessionContextProvider>
      </body>
    </html>
  );
}