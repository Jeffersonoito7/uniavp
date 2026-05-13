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
  corFundo: string
  corCard: string
  corBorda: string
  corTexto: string
  corSidebar: string
  whatsappSuporte: string
  dominioCustomizado: string
  planosAtivo: boolean
  isDominioMaster: boolean
}

export async function getSiteConfig(): Promise<SiteConfig> {
  // Sempre busca do banco — todos os clientes usam o mesmo domínio
  const client = createServiceRoleClient()
  const { data } = await (client.from('configuracoes') as any)
    .select('chave, valor')
    .in('chave', [
      'site_nome', 'site_slogan', 'site_logo_url',
      'logo_menu_url', 'logo_pagina_url', 'logo_favicon_url',
      'site_cor_primaria', 'site_cor_secundaria',
      'cor_fundo', 'cor_card', 'cor_borda', 'cor_texto', 'cor_sidebar',
      'whatsapp_suporte', 'dominio_customizado', 'planos_ativo',
    ])

  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    try { map[row.chave] = JSON.parse(row.valor) } catch { map[row.chave] = row.valor }
  }

  return {
    nome: map['site_nome'] || 'Universidade',
    slogan: map['site_slogan'] || 'Plataforma de Formação e Treinamento Corporativo',
    logoUrl: map['site_logo_url'] || '',
    logoMenuUrl: map['logo_menu_url'] || map['site_logo_url'] || '',
    logoPaginaUrl: map['logo_pagina_url'] || map['site_logo_url'] || '',
    logoFaviconUrl: map['logo_favicon_url'] || map['site_logo_url'] || '',
    corPrimaria: map['site_cor_primaria'] || '#333687',
    corSecundaria: map['site_cor_secundaria'] || '#02A153',
    corFundo: map['cor_fundo'] || '#08090d',
    corCard: map['cor_card'] || '#181b24',
    corBorda: map['cor_borda'] || '#252836',
    corTexto: map['cor_texto'] || '#f0f1f5',
    corSidebar: map['cor_sidebar'] || map['cor_card'] || '#181b24',
    whatsappSuporte: map['whatsapp_suporte'] || '',
    dominioCustomizado: map['dominio_customizado'] || '',
    planosAtivo: map['planos_ativo'] === 'true',
    isDominioMaster: false,
  }
}
