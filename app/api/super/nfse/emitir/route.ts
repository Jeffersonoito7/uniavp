import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { decCert, carregarCertificado, carregarCertificadoDePem, emitirNfse } from '@/lib/nfse-engine'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function getSuperAdmin(userId: string, sb: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await sb.from('super_admins').select('id').eq('user_id', userId).eq('ativo', true).maybeSingle()
  return !!data
}

async function lerConfig(sb: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await (sb as any).from('nfse_config').select('*').eq('id', 'default').maybeSingle()
  return data
}

async function proximoRps(sb: ReturnType<typeof createServiceRoleClient>): Promise<number> {
  const { data } = await (sb as any).from('nfse_config').select('rps_seq').eq('id', 'default').maybeSingle()
  const n = (Number(data?.rps_seq ?? 0)) + 1
  await (sb as any).from('nfse_config').update({ rps_seq: n }).eq('id', 'default')
  return n
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const sb = createServiceRoleClient()
  if (!await getSuperAdmin(user.id, sb)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const cfg = await lerConfig(sb)
  if (!cfg) return NextResponse.json({ error: 'Configuração NFS-e não encontrada.' }, { status: 500 })

  const { valor, descricao, tomador } = await req.json()
  if (!valor || Number(valor) <= 0) return NextResponse.json({ error: 'Informe o valor do serviço.' }, { status: 400 })

  const faltando: string[] = []
  if (!cfg.cert_configurado) faltando.push('Certificado digital (.pfx)')
  if (!cfg.url_servico) faltando.push('URL do serviço (WSDL)')
  if (!cfg.cnpj) faltando.push('CNPJ do emissor')
  if (!cfg.inscricao_municipal) faltando.push('Inscrição municipal')
  if (!cfg.item_lista_servico) faltando.push('Item da lista de serviço')
  if (!cfg.aliquota_iss) faltando.push('Alíquota do ISS')
  if (faltando.length > 0) {
    return NextResponse.json({ error: 'Configuração incompleta. Preencha: ' + faltando.join(', ') + '.' }, { status: 400 })
  }

  let certInfo: Awaited<ReturnType<typeof carregarCertificado>>
  try {
    if (cfg.key_pem_enc && cfg.cert_pem_enc) {
      // PEMs pre-extraidos (formato preferencial, compativel com certs modernos)
      const keyPem = decCert(cfg.key_pem_enc).toString('utf8')
      const certPem = decCert(cfg.cert_pem_enc).toString('utf8')
      certInfo = carregarCertificadoDePem(keyPem, certPem)
    } else {
      // Fallback: parse direto do PFX (pode falhar com algoritmos legados)
      const pfxBuffer = decCert(cfg.cert_enc!)
      const senha = decCert(cfg.cert_pass_enc!).toString('utf8')
      certInfo = carregarCertificado(pfxBuffer, senha)
    }
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro ao ler o certificado digital: ' + (e?.message ?? '') }, { status: 500 })
  }

  const numeroRps = await proximoRps(sb)

  const cfgEmissao = {
    urlServico: cfg.url_servico!,
    cnpj: cfg.cnpj!,
    inscricaoMunicipal: cfg.inscricao_municipal,
    itemListaServico: cfg.item_lista_servico,
    aliquotaIss: cfg.aliquota_iss,
    optanteSimples: cfg.optante_simples ?? true,
    incentivadorCultural: cfg.incentivador_cultural ?? false,
    codigoMunicipioIbge: cfg.codigo_municipio_ibge,
    serieRps: cfg.serie_rps ?? '1',
    descricaoServico: cfg.descricao_servico,
    codigoTributacaoMunicipio: cfg.codigo_tributacao_municipio,
    ambiente: cfg.ambiente ?? 'homologacao',
  }

  try {
    const r = await emitirNfse(cfgEmissao, { valor, descricao, tomador, numeroRps }, certInfo)

    if (r.ok) {
      await (sb as any).from('nfse_notas').insert({
        numero: r.numero,
        codigo_verificacao: r.codigoVerificacao,
        valor: Number(valor),
        descricao: descricao ?? '',
        tomador: tomador ?? null,
        tomador_doc: tomador?.cpfCnpj ?? tomador?.cnpj ?? tomador?.cpf ?? tomador?.doc ?? '',
        tomador_nome: tomador?.razaoSocial ?? tomador?.nome ?? '',
        item: cfg.item_lista_servico ?? '',
        aliquota: String(cfg.aliquota_iss ?? ''),
        status: 'ativa',
        rps: numeroRps,
        xml: r.xml ?? null,
        data: new Date().toISOString(),
      })

      return NextResponse.json({ ok: true, numero: r.numero, codigoVerificacao: r.codigoVerificacao, ambiente: cfg.ambiente ?? 'homologacao' })
    }

    // Emissão rejeitada pela prefeitura: desfaz o incremento de RPS
    await (sb as any).from('nfse_config').update({ rps_seq: numeroRps - 1 }).eq('id', 'default')

    return NextResponse.json({
      error: r.erros && r.erros.length ? r.erros.join(' | ') : 'A prefeitura recusou a nota.',
      httpStatus: r.httpStatus,
      respostaBruta: r.respostaBruta,
    }, { status: 422 })
  } catch (e: any) {
    await (sb as any).from('nfse_config').update({ rps_seq: numeroRps - 1 }).eq('id', 'default')
    return NextResponse.json({ error: e?.message ?? 'Falha ao emitir a NFS-e.' }, { status: 500 })
  }
}
