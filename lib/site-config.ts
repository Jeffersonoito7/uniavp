import { createServiceRoleClient } from '@/lib/supabase-server'
import { getTenantId } from '@/lib/tenant'

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
  cncpvHabilitado: boolean
}

import { DOMINIO_MASTER } from './constants'

// Config padrão da Oito7Digital (domínio master — sem tenant)
const CONFIG_MASTER: SiteConfig = {
  nome: 'Oito7 Digital',
  slogan: 'Plataforma White-Label de Formação',
  logoUrl: '',
  logoMenuUrl: '',
  logoPaginaUrl: '',
  logoFaviconUrl: '',
  corPrimaria: '#333687',
  corSecundaria: '#02A153',
  corFundo: '#08090d',
  corCard: '#181b24',
  corBorda: '#252836',
  corTexto: '#f0f1f5',
  corSidebar: '#181b24',
  whatsappSuporte: '',
  dominioCustomizado: '',
  planosAtivo: false,
  isDominioMaster: true,
  cncpvHabilitado: false,
}

export async function getSiteConfig(host?: string): Promise<SiteConfig> {
  const { unstable_noStore: noStore } = await import('next/cache')
  noStore()

  const domain = (host ?? '').replace(/:\d+$/, '')

  // Domínio master retorna config própria sem buscar no banco
  if (domain === DOMINIO_MASTER || domain === 'localhost') {
    return CONFIG_MASTER
  }

  const tenantId = domain ? await getTenantId(domain) : null

  // Sem tenant mapeado — retorna config master como fallback seguro
  if (!tenantId) return CONFIG_MASTER

  const client = createServiceRoleClient()
  const { data } = await client.from('configuracoes')
    .select('chave, valor')
    .eq('tenant_id', tenantId)
    .in('chave', [
      'site_nome', 'site_slogan', 'site_logo_url',
      'logo_menu_url', 'logo_pagina_url', 'logo_favicon_url',
      'site_cor_primaria', 'site_cor_secundaria',
      'cor_fundo', 'cor_card', 'cor_borda', 'cor_texto', 'cor_sidebar',
      'whatsapp_suporte', 'dominio_customizado', 'planos_ativo', 'cncpv_habilitado',
    ])

  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    const s = String(row.valor ?? '')
    try { map[row.chave] = JSON.parse(s) } catch { map[row.chave] = s }
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
    cncpvHabilitado: map['cncpv_habilitado'] !== 'false',
    isDominioMaster: false,
  }
}
