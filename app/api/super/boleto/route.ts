import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { criarBoleto } from '@/lib/efi'
import { enviarWhatsApp } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

async function isSuperAdmin(userId: string, adminClient: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await (adminClient.from('super_admins') as any).select('id').eq('user_id', userId).eq('ativo', true).maybeSingle()
  return !!data
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  if (!await isSuperAdmin(user.id, adminClient)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { cliente_id } = await req.json()

  const { data: cliente } = await (adminClient.from('clientes') as any)
    .select('id, nome, mensalidade, contato_whatsapp, contato_nome, contato_email, cpf_cnpj, vencimento_dia')
    .eq('id', cliente_id).maybeSingle()

  if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  if (!cliente.mensalidade || cliente.mensalidade <= 0) return NextResponse.json({ error: 'Mensalidade não configurada' }, { status: 400 })
  if (!cliente.cpf_cnpj) return NextResponse.json({ error: 'CPF/CNPJ do cliente não cadastrado' }, { status: 400 })

  // Busca configurações do boleto
  const { data: cfgRows } = await (adminClient.from('configuracoes') as any)
    .select('chave, valor')
    .in('chave', ['boleto_mensagem', 'boleto_instrucoes', 'boleto_multa', 'boleto_juros', 'site_nome'])
  const cfg: Record<string, string> = {}
  for (const r of cfgRows ?? []) { try { cfg[r.chave] = JSON.parse(r.valor) } catch { cfg[r.chave] = r.valor } }

  const hoje = new Date()
  const dia = cliente.vencimento_dia || 10
  let venc = new Date(hoje.getFullYear(), hoje.getMonth(), dia)
  if (venc <= hoje) venc = new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia)
  const vencimento = venc.toISOString().split('T')[0]

  try {
    const instrucoes = cfg['boleto_instrucoes']
      ? cfg['boleto_instrucoes'].split('\n').filter(Boolean).slice(0, 4)
      : undefined

    const boleto = await criarBoleto({
      valor: cliente.mensalidade,
      vencimento,
      nomeCliente: cliente.contato_nome || cliente.nome,
      cpfCnpj: cliente.cpf_cnpj,
      email: cliente.contato_email || undefined,
      mensagem: cfg['boleto_mensagem'] || `Mensalidade ${cfg['site_nome'] || 'plataforma'} — ${cliente.nome}`,
      instrucoes,
      multa: cfg['boleto_multa'] ? Number(cfg['boleto_multa']) : 2,
      juros: cfg['boleto_juros'] ? Number(cfg['boleto_juros']) : 1,
      descricao: `Mensalidade ${cliente.nome}`,
    })

    // Salva no banco
    const { data: cobranca } = await (adminClient.from('cobrancas') as any).insert({
      cliente_id,
      txid: String(boleto.chargeId),
      valor: cliente.mensalidade,
      status: 'pendente',
      tipo: 'boleto',
      codigo_barras: boleto.codigoBarras,
      pdf_url: boleto.pdfUrl,
      vencimento,
    }).select().single()

    await (adminClient.from('clientes') as any)
      .update({ status_pagamento: 'pendente' })
      .eq('id', cliente_id)

    // Envia via WhatsApp
    if (cliente.contato_whatsapp) {
      const valor = Number(cliente.mensalidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      await enviarWhatsApp(
        cliente.contato_whatsapp,
        `🧾 *Boleto ${cliente.nome}*\n\nValor: *${valor}*\nVencimento: ${new Date(vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}\n\n*Código de barras:*\n${boleto.codigoBarras}\n\n📄 PDF: ${boleto.pdfUrl}`
      )
    }

    return NextResponse.json({ ok: true, cobranca, boleto })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
