import { ReactNode } from 'react';
import './globals.css';

// This is the root layout. It's a passthrough component because we have
// two different root layouts: one for the main site ((default)) and one for AMP pages ((amp)).
// The actual <html> and <body> tags are defined in the layouts of the
// respective route groups. This setup prevents nesting <html> tags and causing hydration errors.
export default function RootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}