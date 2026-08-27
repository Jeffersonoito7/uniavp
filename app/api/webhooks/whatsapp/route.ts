import { NextRequest, NextResponse } from 'next/server'
import { alertarDiscord } from '@/lib/discord'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { processarMensagemFunil } from '@/lib/funil-consultor'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function autorizado(req: NextRequest): boolean {
  return req.headers.get('apikey') === process.env.EVOLUTION_API_KEY
}

function extrairNumero(remoteJid: string): string {
  return remoteJid.replace(/@.*$/, '').replace(/\D/g, '')
}

function extrairTexto(data: Record<string, unknown>): string | null {
  const msg = data?.message as Record<string, unknown> | undefined
  if (!msg) return null
  return (
    (msg.conversation as string) ??
    (msg.extendedTextMessage as Record<string, unknown>)?.text as string ??
    null
  )
}

export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const evento: string = body?.event ?? ''
    const instancia: string = body?.instance ?? ''

    if (evento === 'connection.update') {
      const state: string = (body?.data?.state ?? '').toLowerCase()
      if (state === 'close' || state === 'refused') {
        await alertarDiscord(
          'aviso',
          'WhatsApp desconectado',
          `A instância \`${instancia}\` foi desconectada (estado: ${state}).\nAcesse o painel admin → Configurações → Conectar WhatsApp para reconectar.`,
        )
      }
    }

    if (evento === 'messages.upsert') {
      const data = body?.data as Record<string, unknown> | undefined
      // Ignora mensagens enviadas pelo proprio bot
      if ((data?.key as Record<string, unknown>)?.fromMe) return NextResponse.json({ ok: true })

      const remoteJid = (data?.key as Record<string, unknown>)?.remoteJid as string | undefined
      if (!remoteJid || remoteJid.endsWith('@g.us')) return NextResponse.json({ ok: true }) // ignora grupos

      const numero = extrairNumero(remoteJid)
      const texto = extrairTexto(data ?? {})
      if (!numero || !texto) return NextResponse.json({ ok: true })

      const adminClient = createServiceRoleClient()
      const { data: aluno } = await (adminClient.from('alunos') as any)
        .select('id, nome, whatsapp, tenant_id, funil_estado, funil_pergunta_atual, funil_respostas')
        .or(`whatsapp.eq.${numero},whatsapp.eq.55${numero}`)
        .maybeSingle() as { data: { id: string; nome: string; whatsapp: string; tenant_id: string | null; funil_estado: number; funil_pergunta_atual: number; funil_respostas: number[] } | null }

      if (aluno && aluno.funil_estado > 0 && aluno.funil_estado < 4) {
        await processarMensagemFunil(aluno, texto, instancia, adminClient)
      }
    }
  } catch (err) {
    console.error('[webhook/whatsapp]', err)
  }

  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  return NextResponse.json({ ok: true })
}
