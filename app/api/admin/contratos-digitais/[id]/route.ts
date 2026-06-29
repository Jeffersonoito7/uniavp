import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'
import { gerarTokenAssinante } from '@/lib/contrato-digital'
import { enviarWhatsApp, getInstanciaTenant } from '@/lib/whatsapp'
import { getSiteConfig } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  let q = adminClient
    .from('contratos_digitais')
    .select(`*, assinantes:contrato_assinantes(*), aditivos:contratos_digitais!contrato_base_id(id, titulo, numero_registro, status)`)
    .eq('id', params.id)
  if (ctx.tenantId) q = q.eq('tenant_id', ctx.tenantId)
  const { data: contrato } = await q.maybeSingle()

  if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
  return NextResponse.json({ contrato })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const host = req.headers.get('host') || ''
  const siteConfig = await getSiteConfig(host)
  const appUrl = siteConfig.dominioCustomizado ? `https://${siteConfig.dominioCustomizado}` : `https://${host}`

  const body = await req.json()

  if (body.cancelar) {
    let q = adminClient.from('contratos_digitais').update({ status: 'cancelado' }).eq('id', params.id)
    if (ctx.tenantId) q = q.eq('tenant_id', ctx.tenantId)
    const { error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (body.reenviar_assinante_id) {
    let qc = adminClient.from('contratos_digitais').select('titulo').eq('id', params.id)
    if (ctx.tenantId) qc = qc.eq('tenant_id', ctx.tenantId)
    const { data: contrato } = await qc.maybeSingle()
    if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })

    const { data: assinante } = await adminClient
      .from('contrato_assinantes')
      .select('nome, whatsapp, token_acesso')
      .eq('id', body.reenviar_assinante_id)
      .eq('contrato_id', params.id)
      .maybeSingle()

    if (assinante?.whatsapp && assinante.token_acesso) {
      const instancia = await getInstanciaTenant(ctx.tenantId, adminClient)
      if (instancia) {
        const link = `${appUrl}/contrato/assinar/${assinante.token_acesso}`
        const msg = `Ola, ${assinante.nome}! Seu contrato *${contrato.titulo}* ainda aguarda sua assinatura:\n${link}`
        await enviarWhatsApp(assinante.whatsapp, msg, instancia).catch(() => {})
      }
    }
    return NextResponse.json({ ok: true })
  }

  if (body.renovar_token_assinante_id) {
    let qc = adminClient.from('contratos_digitais').select('id').eq('id', params.id)
    if (ctx.tenantId) qc = qc.eq('tenant_id', ctx.tenantId)
    const { data: contratoCheck } = await qc.maybeSingle()
    if (!contratoCheck) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })

    const { token, expira } = gerarTokenAssinante()
    await adminClient
      .from('contrato_assinantes')
      .update({ token_acesso: token, token_expira_em: expira.toISOString() })
      .eq('id', body.renovar_token_assinante_id)
      .eq('contrato_id', params.id)
    return NextResponse.json({ ok: true, token })
  }

  return NextResponse.json({ error: 'Acao não reconhecida' }, { status: 400 })
}
