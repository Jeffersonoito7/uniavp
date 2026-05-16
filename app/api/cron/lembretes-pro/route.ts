import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

// Roda a cada hora — dispara lembretes pendentes dos PROs
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const admin = createServiceRoleClient()
  const agora = new Date().toISOString()

  // Busca lembretes que já passaram do horário e ainda não foram enviados
  const { data: lembretes } = await (admin.from('pro_lembretes') as any)
    .select('id, mensagem, gestor_id, gestores(nome, whatsapp)')
    .eq('enviado', false)
    .lte('lembrar_em', agora)

  let enviados = 0

  for (const lembrete of lembretes ?? []) {
    const gestor = (lembrete as any).gestores
    if (!gestor?.whatsapp) continue

    const msg = `⏰ *Lembrete!*\n\n${lembrete.mensagem}`
    const ok = await enviarWhatsApp(gestor.whatsapp, msg)

    if (ok) {
      await (admin.from('pro_lembretes') as any)
        .update({ enviado: true })
        .eq('id', lembrete.id)
      enviados++
    }
  }

  return NextResponse.json({ ok: true, enviados })
}
