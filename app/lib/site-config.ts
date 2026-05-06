import { createServiceRoleClient } from '@/lib/supabase-server';

export interface SiteConfig {
  nome: string;
  slogan: string;
  logoUrl: string;
  corPrimaria: string;
  corSecundaria: string;
  whatsappSuporte: string;
  planosAtivo: boolean;
}

export async function getSiteConfig(): Promise<SiteConfig> {
  const adminClient = createServiceRoleClient();
  const { data } = await (adminClient.from('configuracoes') as any)
    .select('chave, valor')
    .in('chave', ['site_nome','site_slogan','site_logo_url','site_cor_primaria','site_cor_secundaria','site_whatsapp_suporte','planos_ativo']);

  const map: Record<string, any> = {};
  (data ?? []).forEach((r: any) => { map[r.chave] = r.valor; });

  return {
    nome: map['site_nome'] ?? 'Universidade AVP',
    slogan: map['site_slogan'] ?? 'Plataforma de Formação',
    logoUrl: map['site_logo_url'] ?? '',
    corPrimaria: map['site_cor_primaria'] ?? '#333687',
    corSecundaria: map['site_cor_secundaria'] ?? '#02A153',
    whatsappSuporte: map['site_whatsapp_suporte'] ?? '',
    planosAtivo: map['planos_ativo'] ?? false,
  };
}
