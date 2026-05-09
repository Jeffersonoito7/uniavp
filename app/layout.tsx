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
        <meta name="apple-mobile-web-app-title" content={config.nome} />
        <link rel="icon" href={config.logoFaviconUrl || '/logo.png'} />
        <link rel="apple-touch-icon" href={config.logoFaviconUrl || '/logo.png'} />
        <link rel="manifest" href="/manifest.json" />
        <style>{`
          :root {
            --avp-blue: ${config.corPrimaria};
            --avp-blue-deep: color-mix(in srgb, ${config.corPrimaria} 80%, black);
            --avp-blue-bright: color-mix(in srgb, ${config.corPrimaria} 80%, white);
            --avp-green: ${config.corSecundaria};
            --avp-green-deep: color-mix(in srgb, ${config.corSecundaria} 80%, black);
            --avp-green-bright: color-mix(in srgb, ${config.corSecundaria} 80%, white);
            --grad-brand: linear-gradient(135deg, ${config.corPrimaria} 0%, color-mix(in srgb, ${config.corPrimaria} 80%, black) 35%, color-mix(in srgb, ${config.corSecundaria} 80%, black) 70%, ${config.corSecundaria} 100%);
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
