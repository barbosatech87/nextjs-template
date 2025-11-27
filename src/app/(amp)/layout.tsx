import { ReactNode } from 'react';
import { Viewport } from 'next';
import '@/app/globals.css';

interface AmpRootLayoutProps {
  children: ReactNode;
}

export const viewport: Viewport = {
  width: "device-width",
  minimumScale: 1,
  initialScale: 1,
};

export default function AmpRootLayout({ children }: AmpRootLayoutProps) {
  // O layout raiz (src/app/layout.tsx) agora lida com as tags html e body condicionalmente.
  // Aqui apenas passamos o conteúdo para evitar aninhamento inválido.
  return (
    <>
      {children}
    </>
  );
}