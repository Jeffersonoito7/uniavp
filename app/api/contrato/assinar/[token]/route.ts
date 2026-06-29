import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { atualizarStatusContrato } from '@/lib/contrato-digital'
import { getIp } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const adminClient = createServiceRoleClient()

  const { data: assinante } = await adminClient
    .from('contrato_assinantes')
    .select('id, nome, email, papel, status, token_expira_em, contrato_id')
    .eq('token_acesso', params.token)
    .maybeSingle()

  if (!assinante) return NextResponse.json({ error: 'Link inválido ou expirado.' }, { status: 404 })

  if (assinante.token_expira_em && new Date(assinante.token_expira_em) < new Date()) {
    return NextResponse.json({ error: 'Este link expirou. Solicite um novo link ao administrador.' }, { status: 410 })
  }

  const { data: contrato } = await adminClient
    .from('contratos_digitais')
    .select('id, titulo, numero_registro, corpo_renderizado, status, assinatura_avp_url, assinado_avp_em')
    .eq('id', assinante.contrato_id)
    .maybeSingle()

  if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 })
  if (contrato.status === 'cancelado') return NextResponse.json({ error: 'Este contrato foi cancelado.' }, { status: 410 })

  if (assinante.status === 'pendente') {
    await adminClient.from('contrato_assinantes').update({ status: 'visualizado' }).eq('id', assinante.id)
  }

  return NextResponse.json({ assinante, contrato })
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const adminClient = createServiceRoleClient()
  const ip = getIp(req)

  const { data: assinante } = await adminClient
    .from('contrato_assinantes')
    .select('id, nome, papel, status, token_expira_em, contrato_id')
    .eq('token_acesso', params.token)
    .maybeSingle()

  if (!assinante) return NextResponse.json({ error: 'Link inválido.' }, { status: 404 })
  if (assinante.token_expira_em && new Date(assinante.token_expira_em) < new Date()) {
    return NextResponse.json({ error: 'Link expirado.' }, { status: 410 })
  }

  const { assinatura_url } = await req.json()
  if (!assinatura_url) return NextResponse.json({ error: 'Assinatura obrigatória.' }, { status: 400 })
  if (typeof assinatura_url === 'string' && assinatura_url.length > 600_000) {
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 400 })
  }
  if (typeof assinatura_url !== 'string' || !assinatura_url.startsWith('data:image/png;base64,')) {
    return NextResponse.json({ error: 'Formato de assinatura inválido.' }, { status: 400 })
  }

  let urlFinal: string
  try {
    const base64 = assinatura_url.replace('data:image/png;base64,', '')
    const buffer = Buffer.from(base64, 'base64')
    const path = `contratos-digitais/${assinante.contrato_id}/${assinante.id}.png`
    const { error: uploadError } = await adminClient.storage.from('documentos').upload(path, buffer, { contentType: 'image/png', upsert: true })
    if (uploadError) throw uploadError
    const { data: pubUrl } = adminClient.storage.from('documentos').getPublicUrl(path)
    urlFinal = pubUrl.publicUrl
  } catch (e) {
    console.error('[assinar-contrato] falha no upload da assinatura:', e)
    return NextResponse.json({ error: 'Falha ao salvar assinatura. Tente novamente.' }, { status: 500 })
  }

  const { data: updated } = await adminClient
    .from('contrato_assinantes')
    .update({
      status: 'assinado',
      assinatura_url: urlFinal,
      ip_assinatura: ip,
      assinado_em: new Date().toISOString(),
    })
    .eq('id', assinante.id)
    .neq('status', 'assinado')
    .select('id')

  if (!updated || (Array.isArray(updated) && updated.length === 0)) {
    return NextResponse.json({ error: 'Voce já assinou este contrato.' }, { status: 409 })
  }

  await atualizarStatusContrato(adminClient, assinante.contrato_id)

  return NextResponse.json({ ok: true, mensagem: 'Assinatura registrada com sucesso!' })
}
