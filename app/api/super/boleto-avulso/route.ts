import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { criarBoleto } from '@/lib/efi'
import { enviarWhatsApp } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

async function isSuperAdmin(userId: string, adminClient: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await (adminClient.from('super_admins') as any)
    .select('id').eq('user_id', userId).eq('ativo', true).maybeSingle()
  return !!data
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  if (!await isSuperAdmin(user.id, adminClient)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json()
  const { nome, cpfCnpj, valor, vencimento, descricao, email, whatsapp, mensagem, instrucoes } = body

  if (!nome || !cpfCnpj || !valor || !vencimento) {
    return NextResponse.json({ error: 'Nome, CPF/CNPJ, valor e vencimento são obrigatórios' }, { status: 400 })
  }

  if (isNaN(Number(valor)) || Number(valor) <= 0) {
    return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
  }

  // Lê configurações de boleto do banco
  const { data: cfgRows } = await (adminClient.from('configuracoes') as any)
    .select('chave, valor')
    .in('chave', ['boleto_mensagem', 'boleto_instrucoes', 'boleto_multa', 'boleto_juros', 'site_nome'])
  const cfg: Record<string, string> = {}
  for (const r of cfgRows ?? []) {
    try { cfg[r.chave] = JSON.parse(r.valor) } catch { cfg[r.chave] = r.valor }
  }

  try {
    const instrucoesFinal = instrucoes
      ? (instrucoes as string).split('\n').filter(Boolean).slice(0, 4)
      : cfg['boleto_instrucoes']
        ? cfg['boleto_instrucoes'].split('\n').filter(Boolean).slice(0, 4)
        : undefined

    const boleto = await criarBoleto({
      valor: Number(valor),
      vencimento,
      nomeCliente: nome,
      cpfCnpj,
      email: email || undefined,
      mensagem: mensagem || cfg['boleto_mensagem'] || `${descricao || 'Serviço'} — ${cfg['site_nome'] || 'Oito7Digital'}`,
      instrucoes: instrucoesFinal,
      multa: cfg['boleto_multa'] ? Number(cfg['boleto_multa']) : 2,
      juros: cfg['boleto_juros'] ? Number(cfg['boleto_juros']) : 1,
      descricao: descricao || 'Boleto avulso',
    })

    // Envia por WhatsApp se informado
    if (whatsapp) {
      const valorFmt = Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      const dataFmt = new Date(vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
      await enviarWhatsApp(
        whatsapp.replace(/\D/g, ''),
        `🧾 *Boleto — ${descricao || 'Serviço'}*\n\nNome: *${nome}*\nValor: *${valorFmt}*\nVencimento: ${dataFmt}\n\n*Código de barras:*\n${boleto.codigoBarras}\n\n📄 PDF: ${boleto.pdfUrl}`
      )
    }

    return NextResponse.json({ ok: true, boleto })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
