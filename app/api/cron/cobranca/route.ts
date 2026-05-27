import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { criarCobrancaPix } from '@/lib/efi'
import { enviarWhatsApp } from '@/lib/whatsapp'
import { getMensagem } from '@/lib/mensagem'
import { alertarDiscord } from '@/lib/discord'
import { createLogger } from '@/lib/logger'
import { randomUUID } from 'crypto'

const log = createLogger('cron/cobranca')

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const adminClient = createServiceRoleClient()
  // Usa horário de Brasília (UTC-3) para evitar calcular vencimento no dia errado
  const agora = new Date()
  const hoje = new Date(agora.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`

  const { data: clientes } = await adminClient.from('clientes')
    .select('id, nome, mensalidade, contato_whatsapp, contato_nome, vencimento_dia, status_pagamento, ultimo_pagamento, ativo')
    .gt('mensalidade', 0)

  let geradas = 0
  let suspensas = 0
  let falhas = 0

  for (const c of clientes ?? []) {
    const diaRaw = c.vencimento_dia || 10
    const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()
    const dia = Math.min(diaRaw, ultimoDiaMes)
    const vencimento = new Date(hoje.getFullYear(), hoje.getMonth(), dia)
    const vencStr = vencimento.toISOString().split('T')[0]

    // Verifica se já existe cobrança pendente este mês
    const { data: cobExistente } = await adminClient.from('cobrancas')
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
          valor: c.mensalidade!,
          vencimento: vencStr,
          nomeDevedor: c.contato_nome || c.nome,
          descricao: `Mensalidade ${c.nome}`,
        })
        await adminClient.from('cobrancas').insert({
          cliente_id: c.id, txid, valor: c.mensalidade!,
          status: 'pendente', pix_copia_cola: pixCopiaECola,
          qrcode_base64: qrcodeBase64, vencimento: vencStr,
        })
        await adminClient.from('clientes').update({ status_pagamento: 'pendente', pix_txid: txid }).eq('id', c.id)

        if (c.contato_whatsapp) {
          const valor = Number(c.mensalidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          await enviarWhatsApp(c.contato_whatsapp,
            await getMensagem('cobranca_nova', {
              clienteNome: c.nome, valor,
              vencimento: new Date(vencStr + 'T12:00:00').toLocaleDateString('pt-BR'),
              pixCopiaECola,
            }, adminClient))
        }
        geradas++
      } catch (e) {
        log.error('erro ao gerar cobrança', { clienteId: c.id, err: String(e) })
        falhas++
      }
    }

    // Suspende se estiver mais de 3 dias em atraso
    if (c.ativo && c.status_pagamento === 'pendente' && hojeStr > vencStr) {
      const diasAtraso = Math.ceil((hoje.getTime() - vencimento.getTime()) / 86400000)
      if (diasAtraso >= 3) {
        await adminClient.from('clientes')
          .update({ ativo: false, status_pagamento: 'suspenso' })
          .eq('id', c.id)

        if (c.contato_whatsapp) {
          await enviarWhatsApp(c.contato_whatsapp,
            await getMensagem('cobranca_acesso_suspenso', { clienteNome: c.nome }, adminClient))
        }
        suspensas++
      }
    }
  }

  if (falhas > 0) {
    await alertarDiscord('aviso', 'Cron cobrança com falhas', `${geradas} geradas, ${suspensas} suspensas, ${falhas} falha(s) ao gerar PIX. Verifique os logs.`)
  }

  return NextResponse.json({ ok: true, geradas, suspensas, falhas })
}
