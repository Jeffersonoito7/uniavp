import { NextRequest, NextResponse } from 'next/server'
import { processarMensagemPRO } from '@/lib/pro-agente'
import { enviarWhatsApp } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Evolution API envia eventos de vários tipos — só processa mensagens de texto recebidas
    const evento = body?.event
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

    // Envia resposta
    await enviarWhatsApp(numero, resposta)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}

// Evolution API faz GET para verificar o webhook
export async function GET() {
  return NextResponse.json({ ok: true, service: 'UNIAVP PRO Assistant' })
}
