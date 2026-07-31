import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { decCert, carregarCertificado, cancelarNfse } from '@/lib/nfse-engine'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function getSuperAdmin(userId: string, sb: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await sb.from('super_admins').select('id').eq('user_id', userId).eq('ativo', true).maybeSingle()
  return !!data
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const sb = createServiceRoleClient()
  if (!await getSuperAdmin(user.id, sb)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { numero, codigoCancelamento, id: notaId } = await req.json()
  if (!numero) return NextResponse.json({ error: 'Informe o número da nota a cancelar.' }, { status: 400 })

  const { data: cfg } = await (sb as any).from('nfse_config').select('*').eq('id', 'default').maybeSingle()
  if (!cfg) return NextResponse.json({ error: 'Configuração NFS-e não encontrada.' }, { status: 500 })

  let certInfo: Awaited<ReturnType<typeof carregarCertificado>>
  try {
    const pfxBuffer = decCert(cfg.cert_enc!)
    const senha = decCert(cfg.cert_pass_enc!).toString('utf8')
    certInfo = carregarCertificado(pfxBuffer, senha)
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro ao ler o certificado digital: ' + (e?.message ?? '') }, { status: 500 })
  }

  const cfgEmissao = {
    urlServico: cfg.url_servico!,
    cnpj: cfg.cnpj!,
    inscricaoMunicipal: cfg.inscricao_municipal,
    codigoMunicipioIbge: cfg.codigo_municipio_ibge,
  }

  try {
    const r = await cancelarNfse(cfgEmissao, { numero, codigoCancelamento: codigoCancelamento ?? '1' }, certInfo)
    if (r.ok) {
      if (notaId) await (sb as any).from('nfse_notas').update({ status: 'cancelada' }).eq('id', notaId)
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: r.erros?.join(' | ') ?? 'A prefeitura recusou o cancelamento.' }, { status: 422 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Falha ao cancelar a NFS-e.' }, { status: 500 })
  }
}
