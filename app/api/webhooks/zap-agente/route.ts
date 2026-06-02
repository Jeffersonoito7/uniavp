import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { captureException } from '@/lib/monitor'

export const dynamic = 'force-dynamic'

const EVO_URL = process.env.EVOLUTION_API_URL
const EVO_KEY = process.env.EVOLUTION_API_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

// ── Envia mensagem via WhatsApp ──────────────────────────────────────────────
async function enviarWpp(instancia: string, numero: string, texto: string) {
  if (!EVO_URL || !EVO_KEY) return
  await fetch(`${EVO_URL}/message/sendText/${instancia}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
    body: JSON.stringify({
      number: numero.replace(/\D/g, ''),
      textMessage: { text: texto },
    }),
  })
}

// ── Busca dados do mês atual do gestor ──────────────────────────────────────
async function buscarResumoMes(gestorId: string, adminClient: ReturnType<typeof createServiceRoleClient>) {
  const inicio = new Date()
  inicio.setDate(1)
  const inicioStr = inicio.toISOString().split('T')[0]

  const { data: registros } = await adminClient.from('gestor_registros')
    .select('tipo, valor, quantidade, descricao, data_referencia, created_at')
    .eq('gestor_id', gestorId)
    .gte('data_referencia', inicioStr)
    .order('created_at', { ascending: false })

  const rows = registros ?? []

  const soma = (tipo: string) => rows.filter((r: any) => r.tipo === tipo)
    .reduce((acc: number, r: any) => acc + Number(r.valor ?? 0), 0)
  const count = (tipo: string) => rows.filter((r: any) => r.tipo === tipo)
    .reduce((acc: number, r: any) => acc + Number(r.quantidade ?? 1), 0)

  return {
    cotacoes: count('cotacao'),
    vendas: count('venda'),
    receitas: soma('receita'),
    contas_pagar: soma('conta_pagar'),
    saldo: soma('receita') - soma('conta_pagar'),
    ultimos: rows.slice(0, 5),
  }
}

// ── Chama Claude para interpretar a mensagem ─────────────────────────────────
async function interpretarMensagem(
  mensagem: string,
  nomeGestor: string,
  resumo: Awaited<ReturnType<typeof buscarResumoMes>>
): Promise<{ acao: string; tipo?: string; quantidade?: number; valor?: number; descricao?: string; resposta: string }> {

  const mes = new Date().toLocaleDateString('pt-BR', { month: 'long' })

  const system = `Você é um assistente de negócios via WhatsApp para consultores de proteção veicular (AVP).
O gestor ${nomeGestor} vai te mandar mensagens e você precisa ajudá-lo.

RESUMO DO MÊS (${mes}):
- Cotações realizadas: ${resumo.cotacoes}
- Vendas fechadas: ${resumo.vendas}
- Receitas: R$ ${resumo.receitas.toFixed(2)}
- Contas a pagar: R$ ${resumo.contas_pagar.toFixed(2)}
- Saldo líquido: R$ ${resumo.saldo.toFixed(2)}

VOCÊ PODE FAZER 4 COISAS:

1. REGISTRAR — quando o gestor informa um dado novo:
   Exemplos: "fechei 3 vendas", "fiz 8 cotações hoje", "paguei 150 de gasolina", "recebi 500 de comissão"
   Tipos válidos: cotacao | venda | conta_pagar | receita

2. CONSULTAR — quando o gestor pede informações:
   Exemplos: "quantas vendas fiz?", "resumo do mês", "qual meu saldo?", "mostre meus registros"

3. SCRIPT — quando pede argumento de vendas ou ajuda comercial:
   Exemplos: "me dá um argumento", "como convencer cliente a fechar", "objeção de preço"

4. AJUDA — quando não entender ou pedir menu

RESPONDA SEMPRE EM JSON VÁLIDO (sem markdown):
{
  "acao": "registrar" | "consultar" | "script" | "ajuda",
  "tipo": "cotacao" | "venda" | "conta_pagar" | "receita",  (só para registrar)
  "quantidade": número,  (só para registrar — padrão 1)
  "valor": número decimal,  (só para registrar — padrão 0)
  "descricao": "texto curto",  (só para registrar)
  "resposta": "mensagem formatada para WhatsApp com emojis"
}

Na "resposta": use emojis, seja direto, use negrito com *asteriscos*, máximo 10 linhas.`

  if (!ANTHROPIC_KEY) {
    return {
      acao: 'ajuda',
      resposta: '⚠️ Assistente indisponível no momento. Tente mais tarde.'
    }
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system,
        messages: [{ role: 'user', content: mensagem }],
      }),
    })

    const data = await res.json()
    const texto = data.content?.[0]?.text ?? ''
    const parsed = JSON.parse(texto)
    return parsed
  } catch (e) {
    captureException(e, { endpoint: 'zap-agente/chamarClaude' })
    return { acao: 'ajuda', resposta: '⚠️ Não entendi. Tente: "menu" para ver o que posso fazer.' }
  }
}

// ── Webhook principal ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Ignora eventos que não são mensagens recebidas
    const evento = body.event ?? body.type ?? ''
    if (!evento.includes('message') && !evento.includes('MESSAGE')) {
      return NextResponse.json({ ok: true })
    }

    // Extrai dados da mensagem (formato Evolution API)
    const msgData = body.data ?? body
    const key = msgData.key ?? {}
    const fromMe = key.fromMe ?? false
    if (fromMe) return NextResponse.json({ ok: true }) // ignora mensagens enviadas pelo próprio bot

    const remoteJid: string = key.remoteJid ?? ''
    if (!remoteJid || remoteJid.includes('@g.us')) return NextResponse.json({ ok: true }) // ignora grupos

    // Extrai número do remetente
    const numeroRaw = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '')
    const numero = numeroRaw.startsWith('55') ? numeroRaw : `55${numeroRaw}`

    // Extrai texto da mensagem
    const msg = msgData.message ?? {}
    const texto: string = (
      msg.conversation ??
      msg.extendedTextMessage?.text ??
      msg.imageMessage?.caption ??
      ''
    ).trim()

    if (!texto) return NextResponse.json({ ok: true })

    const instancia: string = body.instance ?? msgData.instance ?? ''

    const adminClient = createServiceRoleClient()

    // Identifica o gestor pelo WhatsApp
    const { data: gestor } = await adminClient.from('gestores')
      .select('id, nome, whatsapp')
      .eq('whatsapp', numero)
      .eq('ativo', true)
      .maybeSingle()

    if (!gestor) {
      // Remetente não é gestor PRO — ignora silenciosamente
      return NextResponse.json({ ok: true })
    }

    // Busca resumo do mês
    const resumo = await buscarResumoMes(gestor.id, adminClient)

    // Interpreta com Claude
    const resultado = await interpretarMensagem(texto, gestor.nome, resumo)

    // Executa ação de registro se necessário
    if (resultado.acao === 'registrar' && resultado.tipo) {
      await adminClient.from('gestor_registros').insert({
        gestor_id: gestor.id,
        tipo: resultado.tipo,
        quantidade: resultado.quantidade ?? 1,
        valor: resultado.valor ?? 0,
        descricao: resultado.descricao ?? texto,
        data_referencia: new Date().toISOString().split('T')[0],
      })
    }

    // Envia resposta via WhatsApp
    if (resultado.resposta && instancia) {
      await enviarWpp(instancia, numero, resultado.resposta)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    captureException(e, { endpoint: 'zap-agente/POST' })
    return NextResponse.json({ ok: true }) // sempre retorna 200 para Evolution API
  }
}

// ── GET para teste/status ────────────────────────────────────────────────────
export async function GET() {
  return NextResponse.json({ ok: true, agente: 'WhatsApp Agente AVP v1' })
}
