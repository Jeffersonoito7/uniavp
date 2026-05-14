import { createServiceRoleClient } from '@/lib/supabase-server'
import CarteiraDisplay from '@/app/aluno/[whatsapp]/carteira/CarteiraDisplay'

export default async function TesteCarteira() {
  const adminClient = createServiceRoleClient()
  const { data: cfgRows } = await (adminClient.from('configuracoes') as any)
    .select('chave, valor')
    .in('chave', ['site_nome', 'site_logo_url', 'carteira_assinatura_nome', 'carteira_assinatura_cargo', 'carteira_assinatura_empresa', 'carteira_url_verificacao', 'carteira_tagline', 'carteira_logo_esquerda', 'carteira_logo_direita', 'carteira_assinatura_url'])
  const cfg: Record<string, string> = {}
  for (const r of cfgRows ?? []) { try { cfg[r.chave] = JSON.parse(r.valor) } catch { cfg[r.chave] = r.valor } }

  return (
    <CarteiraDisplay
      nome="Jefferson Soares"
      numRegistro="001001"
      fotoUrl={null}
      dataFormacao="13/05/2025"
      validade="13/05/2027"
      cargaHoraria="8h 30min"
      turma="2025"
      whatsapp="5500000000000"
      status="concluido"
      empresaNome={cfg['site_nome'] || 'AUTOVALE PREVENÇÕES'}
      empresaLogoUrl={cfg['site_logo_url'] || null}
      assinaturaNome={cfg['carteira_assinatura_nome'] || 'Jose Tiburcio dos Santos'}
      assinaturaCargo={cfg['carteira_assinatura_cargo'] || 'PRESIDENTE'}
      assinaturaEmpresa={cfg['carteira_assinatura_empresa'] || ''}
      assinaturaUrl={cfg['carteira_assinatura_url'] || null}
      urlVerificacao={cfg['carteira_url_verificacao'] || process.env.NEXT_PUBLIC_APP_URL || ''}
      tagline={cfg['carteira_tagline'] || ''}
      logoEsquerdaUrl={cfg['carteira_logo_esquerda'] || null}
      logoDireitaUrl={cfg['carteira_logo_direita'] || null}
    />
  )
}
