import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const EVO_URL = process.env.EVOLUTION_API_URL!
const EVO_KEY = process.env.EVOLUTION_API_KEY!

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()

  const { data: admin } = await (adminClient.from('admins') as any)
    .select('id, whatsapp_instancia').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  const { data: gestor } = await (adminClient.from('gestores') as any)
    .select('id, whatsapp_instancia').eq('user_id', user.id).eq('ativo', true).maybeSingle()

  const instancia = admin?.whatsapp_instancia || gestor?.whatsapp_instancia
  if (!instancia) return NextResponse.json({ ok: true })

  await fetch(`${EVO_URL}/instance/delete/${instancia}`, {
    method: 'DELETE', headers: { apikey: EVO_KEY }
  }).catch(() => {})

  if (admin) await (adminClient.from('admins') as any).update({ whatsapp_instancia: null }).eq('id', admin.id)
  if (gestor) await (adminClient.from('gestores') as any).update({ whatsapp_instancia: null }).eq('id', gestor.id)

  return NextResponse.json({ ok: true })
}
