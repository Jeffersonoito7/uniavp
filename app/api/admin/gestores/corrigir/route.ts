import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'
import { vencimentoMeses } from '@/lib/date-utils'
export const dynamic = 'force-dynamic'

// POST /api/admin/gestores/corrigir
// Diagnostica e corrige gestor PRO com pagamento confirmado mas status errado.
// Body: { busca: "nome ou whatsapp ou email" }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { busca } = await req.json()
  if (!busca) return NextResponse.json({ error: 'Informe busca (nome, whatsapp ou email)' }, { status: 400 })

  const termo = busca.trim()

  // Busca gestor por nome, whatsapp ou email (OR)
  const { data: gestores } = await (adminClient.from('gestores') as any)
    .select('id, nome, email, whatsapp, status_assinatura, plano_vencimento, ativo, tenant_id')
    .or(`nome.ilike.%${termo}%,whatsapp.ilike.%${termo}%,email.ilike.%${termo}%`)
    .eq('ativo', true)
    .limit(5)

  if (!gestores?.length) {
    return NextResponse.json({ erro: `Nenhum gestor ativo encontrado para "${termo}"` }, { status: 404 })
  }

  const resultados = []

  for (const g of gestores) {
    const agora = new Date()
    const vencimento = g.plano_vencimento ? new Date(g.plano_vencimento) : null
    const estaAtivo = g.status_assinatura === 'ativo' && vencimento && vencimento > agora

    // Busca pagamentos mais recentes
    const { data: pagamentos } = await adminClient.from('gestor_pagamentos')
      .select('id, txid, status, valor, plano_meses, created_at, pago_em')
      .eq('gestor_id', g.id)
      .order('created_at', { ascending: false })
      .limit(5)

    const ultimoPago = (pagamentos ?? []).find((p: any) => p.status === 'pago')

    let corrigido = false
    let acao = 'nenhuma'

    // Situação: tem pagamento marcado como pago mas gestor não está ativo
    if (!estaAtivo && ultimoPago) {
      const meses = (ultimoPago as any).plano_meses ?? 1
      const novoVencimento = vencimentoMeses(meses)
      await adminClient.from('gestores')
        .update({ status_assinatura: 'ativo', plano_vencimento: novoVencimento })
        .eq('id', g.id)
      corrigido = true
      acao = `status ativo, vencimento ${new Date(novoVencimento).toLocaleDateString('pt-BR')}`
    }

    resultados.push({
      gestor: { id: g.id, nome: g.nome, email: g.email, whatsapp: g.whatsapp },
      status_antes: g.status_assinatura,
      vencimento_antes: g.plano_vencimento,
      estava_ativo: estaAtivo,
      pagamentos: (pagamentos ?? []).map((p: any) => ({
        id: p.id,
        status: p.status,
        valor: p.valor,
        plano_meses: p.plano_meses,
        criado_em: p.created_at,
        pago_em: p.pago_em,
      })),
      corrigido,
      acao,
    })
  }

  return NextResponse.json({ ok: true, resultados })
}
