import type { Metadata } from 'next'
import './globals.css'
import { getSiteConfig } from '@/lib/site-config'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig()
  return {
    title: config.nome,
    description: config.slogan,
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const config = await getSiteConfig()
  return (
    <html
      lang="pt-BR"
      style={{ '--avp-blue': config.corPrimaria, '--avp-green': config.corSecundaria } as React.CSSProperties}
    >
      <head>
        <meta name="theme-color" content={config.corPrimaria} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Uni AVP" />
        <link rel="icon" href="/favicon.ico" />
        <style>{`
          :root {
            --avp-blue: ${config.corPrimaria};
            --avp-green: ${config.corSecundaria};
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
