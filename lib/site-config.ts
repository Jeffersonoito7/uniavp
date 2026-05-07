import { createServiceRoleClient } from '@/lib/supabase-server'

export type SiteConfig = {
  nome: string
  slogan: string
  logoUrl: string
  logoMenuUrl: string
  logoPaginaUrl: string
  logoFaviconUrl: string
  corPrimaria: string
  corSecundaria: string
  whatsappSuporte: string
  planosAtivo: boolean
}

export async function getSiteConfig(): Promise<SiteConfig> {
  const client = createServiceRoleClient()
  const { data } = await (client.from('configuracoes') as any)
    .select('chave, valor')
    .in('chave', [
      'site_nome', 'site_slogan', 'site_logo_url',
      'logo_menu_url', 'logo_pagina_url', 'logo_favicon_url',
      'site_cor_primaria', 'site_cor_secundaria',
      'site_whatsapp_suporte', 'planos_ativo',
    ])

  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    try { map[row.chave] = JSON.parse(row.valor) } catch { map[row.chave] = row.valor }
  }

  return {
    nome: map['site_nome'] || 'Universidade AVP',
    slogan: map['site_slogan'] || 'A Única e Mais Completa Plataforma de Formação de Consultores do País',
    logoUrl: map['site_logo_url'] || '/logo.png',
    logoMenuUrl: map['logo_menu_url'] || map['site_logo_url'] || '/logo.png',
    logoPaginaUrl: map['logo_pagina_url'] || map['site_logo_url'] || '/logo.png',
    logoFaviconUrl: map['logo_favicon_url'] || map['site_logo_url'] || '/logo.png',
    corPrimaria: map['site_cor_primaria'] || '#333687',
    corSecundaria: map['site_cor_secundaria'] || '#02A153',
    whatsappSuporte: map['site_whatsapp_suporte'] || '',
    planosAtivo: map['planos_ativo'] === 'true',
  }
}
