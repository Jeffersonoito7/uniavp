import { createServiceRoleClient } from '@/lib/supabase-server'

export type SiteConfig = {
  nome: string
  slogan: string
  logoUrl: string
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
      'site_nome',
      'site_slogan',
      'site_logo_url',
      'site_cor_primaria',
      'site_cor_secundaria',
      'whatsapp_suporte',
      'planos_ativo',
    ])

  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    map[row.chave] = row.valor ?? ''
  }

  return {
    nome: map['site_nome'] || 'Universidade AVP',
    slogan: map['site_slogan'] || 'A Única e Mais Completa Plataforma de Formação de Consultores do País',
    logoUrl: map['site_logo_url'] || '/logo.png',
    corPrimaria: map['site_cor_primaria'] || '#333687',
    corSecundaria: map['site_cor_secundaria'] || '#02A153',
    whatsappSuporte: map['whatsapp_suporte'] || '',
    planosAtivo: map['planos_ativo'] === 'true',
  }
}
