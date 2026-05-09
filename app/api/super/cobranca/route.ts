import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { criarCobrancaPix } from '@/lib/efi'
import { enviarWhatsApp } from '@/lib/whatsapp'
import { randomUUID } from 'crypto'

async function isSuperAdmin(userId: string, adminClient: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await (adminClient.from('super_admins') as any).select('id').eq('user_id', userId).eq('ativo', true).maybeSingle()
  return !!data
}

// POST — gera cobrança PIX para um cliente
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  if (!await isSuperAdmin(user.id, adminClient)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { cliente_id } = await req.json()

  const { data: cliente } = await (adminClient.from('clientes') as any)
    .select('id, nome, mensalidade, contato_whatsapp, contato_nome, vencimento_dia')
    .eq('id', cliente_id).maybeSingle()

  if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  if (!cliente.mensalidade || cliente.mensalidade <= 0) return NextResponse.json({ error: 'Mensalidade não configurada' }, { status: 400 })

  // Calcula vencimento: próximo dia X do mês
  const hoje = new Date()
  const dia = cliente.vencimento_dia || 10
  let venc = new Date(hoje.getFullYear(), hoje.getMonth(), dia)
  if (venc <= hoje) venc = new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia)
  const vencimento = venc.toISOString().split('T')[0]

  const txid = randomUUID().replace(/-/g, '').substring(0, 35)

  try {
    const { pixCopiaECola, qrcodeBase64 } = await criarCobrancaPix({
      txid,
      valor: cliente.mensalidade,
      vencimento,
      nomeDevedor: cliente.contato_nome || cliente.nome,
      descricao: `Mensalidade ${cliente.nome}`,
    })

    const { data: cobranca } = await (adminClient.from('cobrancas') as any).insert({
      cliente_id,
      txid,
      valor: cliente.mensalidade,
      status: 'pendente',
      pix_copia_cola: pixCopiaECola,
      qrcode_base64: qrcodeBase64,
      vencimento,
    }).select().single()

    await (adminClient.from('clientes') as any).update({ status_pagamento: 'pendente', pix_txid: txid }).eq('id', cliente_id)

    // Envia PIX via WhatsApp se tiver número
    if (cliente.contato_whatsapp) {
      const valor = Number(cliente.mensalidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      await enviarWhatsApp(
        cliente.contato_whatsapp,
        `💰 *Cobrança ${cliente.nome}*\n\nValor: *${valor}*\nVencimento: ${new Date(vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}\n\n*PIX Copia e Cola:*\n${pixCopiaECola}`
      )
    }

    return NextResponse.json({ ok: true, cobranca })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET — lista cobranças de um cliente
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  if (!await isSuperAdmin(user.id, adminClient)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const clienteId = req.nextUrl.searchParams.get('cliente_id')
  const query = (adminClient.from('cobrancas') as any).select('*').order('created_at', { ascending: false })
  if (clienteId) query.eq('cliente_id', clienteId)

  const { data } = await query
  return NextResponse.json(data ?? [])
}
