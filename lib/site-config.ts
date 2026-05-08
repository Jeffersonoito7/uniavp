import { createServiceRoleClient } from '@/lib/supabase-server'
import { headers } from 'next/headers'

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
  isDominioMaster: boolean
}

// Domínio principal da Oito7 Digital (plataforma mãe)
const DOMINIO_MASTER = 'universidade.oito7digital.com.br'

const CONFIG_MASTER: SiteConfig = {
  nome: 'Oito7 Digital',
  slogan: 'Plataforma de Formação e Treinamento Corporativo',
  logoUrl: '/oito7-logo.png',
  logoMenuUrl: '/oito7-logo.png',
  logoPaginaUrl: '/oito7-logo.png',
  logoFaviconUrl: '/oito7-logo.png',
  corPrimaria: '#6366f1',
  corSecundaria: '#8b5cf6',
  whatsappSuporte: '',
  planosAtivo: false,
  isDominioMaster: true,
}

export async function getSiteConfig(): Promise<SiteConfig> {
  // Detecta o domínio atual
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const dominio = host.replace(/:\d+$/, '') // remove porta se houver

  // Se for o domínio master, retorna config da Oito7 Digital
  if (dominio === DOMINIO_MASTER || dominio === 'localhost') {
    return CONFIG_MASTER
  }

  // Para domínios de clientes, busca configurações no banco
  const client = createServiceRoleClient()
  const { data } = await (client.from('configuracoes') as any)
    .select('chave, valor')
    .in('chave', [
      'site_nome', 'site_slogan', 'site_logo_url',
      'logo_menu_url', 'logo_pagina_url', 'logo_favicon_url',
      'site_cor_primaria', 'site_cor_secundaria',
      'whatsapp_suporte', 'planos_ativo',
    ])

  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    try { map[row.chave] = JSON.parse(row.valor) } catch { map[row.chave] = row.valor }
  }

  return {
    nome: map['site_nome'] || 'Universidade',
    slogan: map['site_slogan'] || 'Plataforma de Formação e Treinamento Corporativo',
    logoUrl: map['site_logo_url'] || '/logo.png',
    logoMenuUrl: map['logo_menu_url'] || map['site_logo_url'] || '/logo.png',
    logoPaginaUrl: map['logo_pagina_url'] || map['site_logo_url'] || '/logo.png',
    logoFaviconUrl: map['logo_favicon_url'] || map['site_logo_url'] || '/logo.png',
    corPrimaria: map['site_cor_primaria'] || '#333687',
    corSecundaria: map['site_cor_secundaria'] || '#02A153',
    whatsappSuporte: map['whatsapp_suporte'] || '',
    planosAtivo: map['planos_ativo'] === 'true',
    isDominioMaster: false,
  }
}
