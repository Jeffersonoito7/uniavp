import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { criarCobrancaPix } from '@/lib/efi'
import { enviarWhatsApp } from '@/lib/whatsapp'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const adminClient = createServiceRoleClient()
  const hoje = new Date()
  const hojeStr = hoje.toISOString().split('T')[0]

  const { data: clientes } = await (adminClient.from('clientes') as any)
    .select('id, nome, mensalidade, contato_whatsapp, contato_nome, vencimento_dia, status_pagamento, ultimo_pagamento, ativo')
    .gt('mensalidade', 0)

  let geradas = 0
  let suspensas = 0

  for (const c of clientes ?? []) {
    const dia = c.vencimento_dia || 10
    const vencimento = new Date(hoje.getFullYear(), hoje.getMonth(), dia)
    const vencStr = vencimento.toISOString().split('T')[0]

    // Verifica se já existe cobrança pendente este mês
    const { data: cobExistente } = await (adminClient.from('cobrancas') as any)
      .select('id, status')
      .eq('cliente_id', c.id)
      .gte('vencimento', new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0])
      .lte('vencimento', new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0])
      .maybeSingle()

    // Gera cobrança 5 dias antes do vencimento se não existir
    const diasParaVencer = Math.ceil((vencimento.getTime() - hoje.getTime()) / 86400000)
    if (!cobExistente && diasParaVencer <= 5 && diasParaVencer >= 0) {
      const txid = randomUUID().replace(/-/g, '').substring(0, 35)
      try {
        const { pixCopiaECola, qrcodeBase64 } = await criarCobrancaPix({
          txid,
          valor: c.mensalidade,
          vencimento: vencStr,
          nomeDevedor: c.contato_nome || c.nome,
          descricao: `Mensalidade ${c.nome}`,
        })
        await (adminClient.from('cobrancas') as any).insert({
          cliente_id: c.id, txid, valor: c.mensalidade,
          status: 'pendente', pix_copia_cola: pixCopiaECola,
          qrcode_base64: qrcodeBase64, vencimento: vencStr,
        })
        await (adminClient.from('clientes') as any).update({ status_pagamento: 'pendente', pix_txid: txid }).eq('id', c.id)

        if (c.contato_whatsapp) {
          const valor = Number(c.mensalidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          await enviarWhatsApp(
            c.contato_whatsapp,
            `💰 *Cobrança ${c.nome}*\n\nValor: *${valor}*\nVencimento: ${new Date(vencStr + 'T12:00:00').toLocaleDateString('pt-BR')}\n\n*PIX Copia e Cola:*\n${pixCopiaECola}`
          )
        }
        geradas++
      } catch { /* ignora erros individuais */ }
    }

    // Suspende se estiver mais de 3 dias em atraso
    if (c.ativo && c.status_pagamento === 'pendente' && hojeStr > vencStr) {
      const diasAtraso = Math.ceil((hoje.getTime() - vencimento.getTime()) / 86400000)
      if (diasAtraso >= 3) {
        await (adminClient.from('clientes') as any)
          .update({ ativo: false, status_pagamento: 'suspenso' })
          .eq('id', c.id)

        if (c.contato_whatsapp) {
          await enviarWhatsApp(
            c.contato_whatsapp,
            `⚠️ *Acesso suspenso — ${c.nome}*\n\nSeu acesso à plataforma foi suspenso por falta de pagamento.\n\nRegularize para reativar imediatamente.`
          )
        }
        suspensas++
      }
    }
  }

  return NextResponse.json({ ok: true, geradas, suspensas })
}
