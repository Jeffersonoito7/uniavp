import { NextRequest, NextResponse } from 'next/server'
import { processarMensagemPRO } from '@/lib/pro-agente'
import { enviarWhatsApp } from '@/lib/whatsapp'
import { alertarDiscord } from '@/lib/discord'

export const dynamic = 'force-dynamic'

// Evolution API envia o header "apikey" em todos os callbacks
function autorizado(req: NextRequest): boolean {
  return req.headers.get('apikey') === process.env.EVOLUTION_API_KEY
}

export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const evento = body?.event
    const instancia: string = body?.instance ?? ''

    // Detecta desconexão da instância e alerta imediatamente
    if (evento === 'connection.update') {
      const state: string = (body?.data?.state ?? '').toLowerCase()
      if (state === 'close' || state === 'refused') {
        await alertarDiscord(
          'aviso',
          'WhatsApp desconectado',
          `A instância \`${instancia}\` foi desconectada (estado: ${state}).\nAcesse o painel admin → Configurações → Conectar WhatsApp para reconectar.`,
        )
      }
      return NextResponse.json({ ok: true })
    }

    // Só processa mensagens de texto recebidas
    if (evento !== 'messages.upsert') return NextResponse.json({ ok: true })

    const msg = body?.data?.messages?.[0] ?? body?.data
    if (!msg) return NextResponse.json({ ok: true })

    // Ignora mensagens enviadas pelo próprio bot
    if (msg.key?.fromMe) return NextResponse.json({ ok: true })

    // Ignora grupos
    const remoteJid: string = msg.key?.remoteJid ?? ''
    if (remoteJid.includes('@g.us')) return NextResponse.json({ ok: true })

    // Extrai texto da mensagem
    const texto: string =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.ephemeralMessage?.message?.extendedTextMessage?.text ||
      ''

    if (!texto.trim()) return NextResponse.json({ ok: true })

    // Número do remetente (remove @s.whatsapp.net)
    const numero = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '')

    // Processa com o agente IA
    const resposta = await processarMensagemPRO(numero, texto)

    // Se retornou null, não é PRO — ignora
    if (!resposta) return NextResponse.json({ ok: true })

    // Envia resposta pela mesma instância que recebeu a mensagem
    await enviarWhatsApp(numero, resposta, instancia || null)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}

// Evolution API faz GET para verificar o webhook
export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  return NextResponse.json({ ok: true, service: 'UNIAVP PRO Assistant' })
}
