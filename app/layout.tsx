import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Universidade AVP — Formação de Consultores',
  description: 'Plataforma de formação online para consultores da Auto Vale Prevenções. Trilha gamificada, quizzes e certificado oficial.',
  keywords: 'universidade AVP, consultores, formação, auto vale prevenções, treinamento online',
  openGraph: {
    title: 'Universidade AVP — Formação de Consultores',
    description: 'Plataforma de formação online para consultores da Auto Vale Prevenções.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="theme-color" content="#333687" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Uni AVP" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  )
}
