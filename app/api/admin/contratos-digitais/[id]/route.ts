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

  const { data: contrato } = await (adminClient.from('contratos_digitais' as any) as any)
    .select(`*, assinantes:contrato_assinantes(*), aditivos:contratos_digitais!contrato_base_id(id, titulo, numero_registro, status)`)
    .eq('id', params.id).maybeSingle()

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

  // Cancelar contrato
  if (body.cancelar) {
    await (adminClient.from('contratos_digitais' as any) as any).update({ status: 'cancelado' }).eq('id', params.id)
    return NextResponse.json({ ok: true })
  }

  // Reenviar link para assinante especifico
  if (body.reenviar_assinante_id) {
    const { data: contrato } = await (adminClient.from('contratos_digitais' as any) as any)
      .select('titulo').eq('id', params.id).maybeSingle()
    const { data: assinante } = await (adminClient.from('contrato_assinantes' as any) as any)
      .select('nome, whatsapp, token_acesso').eq('id', body.reenviar_assinante_id).maybeSingle()

    if (assinante?.whatsapp && assinante.token_acesso) {
      const instancia = await getInstanciaTenant(ctx.tenantId, adminClient)
      if (instancia) {
        const link = `${appUrl}/contrato/assinar/${assinante.token_acesso}`
        const msg = `Ola, ${assinante.nome}! Seu contrato *${contrato?.titulo}* ainda aguarda sua assinatura:\n${link}`
        await enviarWhatsApp(assinante.whatsapp, msg, instancia).catch(() => {})
      }
    }
    return NextResponse.json({ ok: true })
  }

  // Gerar novo token para assinante (token expirado)
  if (body.renovar_token_assinante_id) {
    const { token, expira } = gerarTokenAssinante()
    await (adminClient.from('contrato_assinantes' as any) as any)
      .update({ token_acesso: token, token_expira_em: expira.toISOString() })
      .eq('id', body.renovar_token_assinante_id)
    return NextResponse.json({ ok: true, token })
  }

  return NextResponse.json({ error: 'Acao não reconhecida' }, { status: 400 })
}
