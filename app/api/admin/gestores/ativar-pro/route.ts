import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'
import { enviarWhatsApp } from '@/lib/whatsapp'
import { getAppUrl } from '@/lib/get-app-url'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { gestor_id, dias = 30 } = await req.json()
  if (!gestor_id) return NextResponse.json({ error: 'gestor_id obrigatório' }, { status: 400 })

  const vencimento = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString()

  let q = adminClient.from('gestores')
    .update({ ativo: true, status_assinatura: 'ativo', plano_vencimento: vencimento, pix_txid: null })
    .eq('id', gestor_id)
  if (ctx.tenantId) q = q.eq('tenant_id', ctx.tenantId)

  const { data: gestor, error } = await q.select('id, nome, whatsapp').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Notifica o gestor via WhatsApp (fire-and-forget)
  if (gestor?.whatsapp) {
    const appUrl = await getAppUrl()
    // Busca nome da plataforma do tenant
    let nomePlataforma = 'Plataforma PRO'
    if (ctx.tenantId) {
      const { data: cfg } = await adminClient.from('configuracoes')
        .select('valor').eq('chave', 'site_nome').eq('tenant_id', ctx.tenantId).maybeSingle()
      try { nomePlataforma = JSON.parse(String(cfg?.valor ?? '')) || nomePlataforma } catch { /**/ }
    }
    enviarWhatsApp(gestor.whatsapp,
      `✅ *Acesso PRO ativado!*\n\nOlá, ${gestor.nome}!\n\nSeu acesso ${nomePlataforma} PRO foi ativado por *${dias} dias*.\n\n👉 ${appUrl}/pro`
    ).catch(() => {})
  }

  return NextResponse.json({ ok: true, vencimento })
}
