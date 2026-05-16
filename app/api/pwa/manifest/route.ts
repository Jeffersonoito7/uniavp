import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = createServiceRoleClient()
  const { data } = await (admin.from('configuracoes') as any)
    .select('chave, valor')
    .in('chave', ['site_nome', 'site_cor_primaria', 'site_cor_secundaria', 'logo_favicon_url', 'site_logo_url'])

  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    try { map[row.chave] = JSON.parse(row.valor) } catch { map[row.chave] = row.valor }
  }

  const nome = map['site_nome'] || 'UNIAVP'
  const nomeAbrev = nome.length > 12 ? nome.split(' ').map((w: string) => w[0]).join('') : nome
  const corPrimaria = map['site_cor_primaria'] || '#02A153'
  const corFundo = '#08090d'
  const icone = map['logo_favicon_url'] || map['site_logo_url'] || '/logo.png'

  const manifest = {
    name: nome,
    short_name: nomeAbrev,
    description: `Plataforma de formação e treinamento — ${nome}`,
    start_url: '/entrar',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: corFundo,
    theme_color: corPrimaria,
    categories: ['education', 'business'],
    icons: [
      { src: icone, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: icone, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
    shortcuts: [
      { name: 'Minhas Aulas', short_name: 'FREE', url: '/entrar', description: 'Painel FREE' },
      { name: 'Painel PRO', short_name: 'PRO', url: '/pro', description: 'Painel PRO' },
      { name: 'Captação', short_name: 'Captar', url: '/captacao', description: 'Página de captação' },
    ],
    screenshots: [],
  }

  return NextResponse.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=3600' },
  })
}
