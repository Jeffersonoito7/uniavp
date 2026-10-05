import { traduzirErro } from '@/lib/erros'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'
import { enviarWhatsApp, getInstanciaTenant } from '@/lib/whatsapp'
import { getAppUrl } from '@/lib/get-app-url'
import { audit, getIp } from '@/lib/audit'
import { reconciliarEquipeGestor } from '@/lib/pix-processor'

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

  // Garante que o gestor pertence ao escopo do admin antes de atualizar.
  // Admins de tenant só enxergam o próprio tenant; gestores com tenant_id NULL
  // (criados, por ex., via promoção aluno→PRO sem tenant) também são aceitos e
  // têm o tenant_id corrigido (back-fill) no mesmo passo. Super admins (tenantId
  // null) têm acesso global.
  let qSel = adminClient.from('gestores').select('id, nome, whatsapp, tenant_id').eq('id', gestor_id)
  if (ctx.tenantId) qSel = qSel.or(`tenant_id.eq.${ctx.tenantId},tenant_id.is.null`)
  const { data: alvo, error: erroSel } = await qSel.maybeSingle()
  if (erroSel) return NextResponse.json({ error: traduzirErro(erroSel) }, { status: 400 })
  if (!alvo) return NextResponse.json({ error: 'Gestor não encontrado' }, { status: 404 })

  const updates: Record<string, unknown> = {
    ativo: true,
    status_assinatura: 'ativo',
    plano_vencimento: vencimento,
    pix_txid: null,
  }
  // Back-fill: se o gestor estava sem tenant, vincula ao tenant do admin agora,
  // eliminando a inconsistência que impedia futuras atualizações por tenant.
  if (ctx.tenantId && !alvo.tenant_id) updates.tenant_id = ctx.tenantId

  const { data: gestor, error } = await (adminClient.from('gestores') as any)
    .update(updates)
    .eq('id', gestor_id)
    .select('id, nome, whatsapp')
    .maybeSingle()
  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 400 })

  // Reconcilia equipe: migra alunos captados quando era FREE (indicador_id) e corrige DDI
  if (gestor?.whatsapp) {
    reconciliarEquipeGestor(gestor.whatsapp, gestor.nome, adminClient).catch(() => {})
  }

  // Notifica o gestor via WhatsApp (fire-and-forget)
  if (gestor?.whatsapp) {
    const appUrl = await getAppUrl(ctx.tenantId)
    // Busca nome da plataforma do tenant
    let nomePlataforma = 'Plataforma PRO'
    if (ctx.tenantId) {
      const { data: cfg } = await adminClient.from('configuracoes')
        .select('valor').eq('chave', 'site_nome').eq('tenant_id', ctx.tenantId).maybeSingle()
      try { nomePlataforma = JSON.parse(String(cfg?.valor ?? '')) || nomePlataforma } catch { /**/ }
    }
    const instancia = await getInstanciaTenant(ctx.tenantId, adminClient)
    enviarWhatsApp(gestor.whatsapp,
      `✓ *Acesso PRO ativado!*

Olá, ${gestor.nome}!

Seu acesso ${nomePlataforma} PRO foi ativado por *${dias} dias*.

👉 ${appUrl}/pro`,
      instancia
    ).catch(() => {})
  }

  await audit({
    acao: 'gestor.ativado',
    entidade: 'gestores',
    entidade_id: gestor_id,
    tenant_id: ctx.tenantId,
    usuario_id: user.id,
    usuario_tipo: 'admin',
    dados_novos: { dias, vencimento, origem: 'manual_admin' },
    ip: getIp(req),
  })

  return NextResponse.json({ ok: true, vencimento })
}
