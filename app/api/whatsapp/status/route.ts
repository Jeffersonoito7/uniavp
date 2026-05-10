import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const EVO_URL = process.env.EVOLUTION_API_URL!
const EVO_KEY = process.env.EVOLUTION_API_KEY!

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ conectado: false })

  const adminClient = createServiceRoleClient()

  const { data: admin } = await (adminClient.from('admins') as any)
    .select('whatsapp_instancia').eq('user_id', user.id).eq('ativo', true).maybeSingle()

  const { data: gestor } = await (adminClient.from('gestores') as any)
    .select('whatsapp_instancia').eq('user_id', user.id).eq('ativo', true).maybeSingle()

  const instancia = admin?.whatsapp_instancia || gestor?.whatsapp_instancia
  if (!instancia) return NextResponse.json({ conectado: false, instancia: null })

  try {
    const res = await fetch(`${EVO_URL}/instance/connectionState/${instancia}`, {
      headers: { apikey: EVO_KEY }
    })
    const data = await res.json()
    const state: string = (data?.instance?.state || data?.state || '').toLowerCase()
    const conectado = state === 'open'

    // Se conectado, pega o número do WhatsApp
    let numero = null
    if (conectado) {
      const infoRes = await fetch(`${EVO_URL}/instance/fetchInstances?instanceName=${instancia}`, {
        headers: { apikey: EVO_KEY }
      })
      const infoData = await infoRes.json()
      numero = infoData?.[0]?.instance?.owner?.split('@')[0] || null
    }

    return NextResponse.json({ conectado, instancia, numero, qrcode: null })
  } catch {
    return NextResponse.json({ conectado: false, instancia, qrcode: null })
  }
}
