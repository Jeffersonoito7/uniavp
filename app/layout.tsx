import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Uni AVP — Universidade Auto Vale Prevenções',
  description: 'Plataforma de formação interna da Auto Vale Prevenções',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#333687" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Uni AVP" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
