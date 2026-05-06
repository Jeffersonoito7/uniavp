import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Auto Base Brasil — Consulta Veicular Completa',
  description: 'Plataforma profissional de consulta veicular. Placa, RENAJUD, Gravame, Leilão, Sinistro, FIPE e muito mais.',
  keywords: 'consulta veicular, placa, RENAJUD, gravame, leilão, sinistro, FIPE, DETRAN',
  openGraph: {
    title: 'Auto Base Brasil — Consulta Veicular Completa',
    description: 'Plataforma profissional de consulta veicular para despachantes, lojistas e compradores.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="theme-color" content="#0055A4" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Auto Base Brasil" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  )
}
