import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { criarCobrancaPix } from '@/lib/efi'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

async function getAluno() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const adminClient = createServiceRoleClient()
  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp, email')
    .eq('user_id', user.id)
    .maybeSingle()
  return aluno ? { aluno, user, adminClient } : null
}

async function getValorPlano(adminClient: any): Promise<number> {
  const { data } = await (adminClient.from('configuracoes') as any)
    .select('valor').eq('chave', 'plano_pro_valor').maybeSingle()
  return Math.max(1, parseFloat(String(data?.valor ?? '').replace(/"/g, '')) || 97)
}

export async function GET() {
  const ctx = await getAluno()
  if (!ctx) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { aluno, user, adminClient } = ctx

  const valorPlano = await getValorPlano(adminClient)

  // Verifica se já tem gestor ativo (já é PRO)
  const { data: gestorAtivo } = await (adminClient.from('gestores') as any)
    .select('id, status_assinatura, plano_vencimento')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .maybeSingle()
  if (gestorAtivo) {
    return NextResponse.json({ jaEhPro: true, valorPlano })
  }

  // Verifica pagamento pendente
  const { data: gestorPendente } = await (adminClient.from('gestores') as any)
    .select('id').eq('user_id', user.id).eq('ativo', false).maybeSingle()

  let ultimoPag = null
  if (gestorPendente) {
    const { data: pag } = await (adminClient.from('gestor_pagamentos') as any)
      .select('pix_copia_cola, qrcode_base64, vencimento, status')
      .eq('gestor_id', gestorPendente.id)
      .eq('status', 'pendente')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    ultimoPag = pag
  }

  return NextResponse.json({ jaEhPro: false, valorPlano, ultimoPagamento: ultimoPag, whatsapp: aluno.whatsapp })
}

export async function POST() {
  const ctx = await getAluno()
  if (!ctx) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { aluno, user, adminClient } = ctx

  const valorPlano = await getValorPlano(adminClient)

  // Verifica se já é PRO
  const { data: gestorAtivo } = await (adminClient.from('gestores') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (gestorAtivo) return NextResponse.json({ error: 'Já possui conta PRO' }, { status: 400 })

  // Cria ou reutiliza gestor pendente
  let gestorId: string
  const { data: gestorPendente } = await (adminClient.from('gestores') as any)
    .select('id').eq('user_id', user.id).eq('ativo', false).maybeSingle()

  if (gestorPendente) {
    gestorId = gestorPendente.id
    // Cancela pagamento pendente anterior
    await (adminClient.from('gestor_pagamentos') as any)
      .update({ status: 'cancelado' })
      .eq('gestor_id', gestorId)
      .eq('status', 'pendente')
  } else {
    const { data: novoGestor } = await (adminClient.from('gestores') as any)
      .insert({
        user_id: user.id,
        nome: aluno.nome,
        email: aluno.email,
        whatsapp: aluno.whatsapp,
        ativo: false,
        status_assinatura: 'pendente_upgrade',
      })
      .select('id')
      .single()
    if (!novoGestor) return NextResponse.json({ error: 'Erro ao criar conta PRO' }, { status: 500 })
    gestorId = novoGestor.id
  }

  // Gera PIX
  const vencimento = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const txid = randomUUID().replace(/-/g, '').substring(0, 35)

  try {
    const { pixCopiaECola, qrcodeBase64 } = await criarCobrancaPix({
      txid,
      valor: valorPlano,
      vencimento,
      nomeDevedor: aluno.nome,
      descricao: 'Assinatura UNIAVP PRO',
    })

    const { data: pagamento } = await (adminClient.from('gestor_pagamentos') as any)
      .insert({
        gestor_id: gestorId,
        txid,
        valor: valorPlano,
        status: 'pendente',
        pix_copia_cola: pixCopiaECola,
        qrcode_base64: qrcodeBase64,
        vencimento,
      })
      .select()
      .single()

    await (adminClient.from('gestores') as any)
      .update({ pix_txid: txid })
      .eq('id', gestorId)

    return NextResponse.json({ ok: true, pagamento })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
