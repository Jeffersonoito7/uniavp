import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp, getInstanciaTenant } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Roda a cada hora — dispara lembretes pendentes dos PROs
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const admin = createServiceRoleClient()
  const agora = new Date().toISOString()

  // Busca lembretes que já passaram do horário e ainda não foram enviados
  const { data: lembretes } = await admin.from('pro_lembretes')
    .select('id, mensagem, gestor_id, gestores(nome, whatsapp, tenant_id, whatsapp_instancia)')
    .eq('enviado', false)
    .lte('lembrar_em', agora)

  let enviados = 0

  for (const lembrete of lembretes ?? []) {
    const gestor = Array.isArray(lembrete.gestores) ? lembrete.gestores[0] : lembrete.gestores
    if (!gestor?.whatsapp) continue

    const instancia = gestor.whatsapp_instancia ?? await getInstanciaTenant(gestor.tenant_id, admin)
    const msg = `⏰ *Lembrete!*\n\n${lembrete.mensagem}`
    const ok = await enviarWhatsApp(gestor.whatsapp, msg, instancia)

    if (ok) {
      await admin.from('pro_lembretes')
        .update({ enviado: true })
        .eq('id', lembrete.id)
      enviados++
    }
  }

  return NextResponse.json({ ok: true, enviados })
}
