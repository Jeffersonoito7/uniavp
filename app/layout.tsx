import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Uni AVP — Universidade Auto Vale Prevenções',
  description: 'Plataforma de formação interna da Auto Vale Prevenções',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="pt-BR"><body>{children}</body></html>);
}
