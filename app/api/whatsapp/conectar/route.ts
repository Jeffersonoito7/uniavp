import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

const EVO_URL = process.env.EVOLUTION_API_URL!
const EVO_KEY = process.env.EVOLUTION_API_KEY!

async function getUserInfo(userId: string, adminClient: ReturnType<typeof createServiceRoleClient>) {
  const { data: admin } = await (adminClient.from('admins') as any)
    .select('id, whatsapp_instancia').eq('user_id', userId).eq('ativo', true).maybeSingle()
  if (admin) return { tipo: 'admin', id: admin.id, instancia: admin.whatsapp_instancia }

  const { data: gestor } = await (adminClient.from('gestores') as any)
    .select('id, whatsapp_instancia').eq('user_id', userId).eq('ativo', true).maybeSingle()
  if (gestor) return { tipo: 'gestor', id: gestor.id, instancia: gestor.whatsapp_instancia }

  return null
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const info = await getUserInfo(user.id, adminClient)
  if (!info) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const instanceName = `oito7-${info.tipo}-${info.id.slice(0, 8)}`

  // Cria ou reconecta a instância na Evolution API
  try {
    // Tenta deletar instância antiga se existir
    if (info.instancia) {
      await fetch(`${EVO_URL}/instance/delete/${info.instancia}`, {
        method: 'DELETE', headers: { apikey: EVO_KEY }
      }).catch(() => {})
    }

    // Cria nova instância
    const res = await fetch(`${EVO_URL}/instance/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({ instanceName, qrcode: true, integration: 'WHATSAPP-BAILEYS' })
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data.message || 'Erro ao criar instância' }, { status: 500 })

    // Salva instância no banco
    if (info.tipo === 'admin') {
      await (adminClient.from('admins') as any).update({ whatsapp_instancia: instanceName }).eq('id', info.id)
    } else {
      await (adminClient.from('gestores') as any).update({ whatsapp_instancia: instanceName }).eq('id', info.id)
    }

    return NextResponse.json({ ok: true, instancia: instanceName, qrcode: data.qrcode?.base64 })
  } catch (e) {
    return NextResponse.json({ error: 'Erro de conexão com Evolution API' }, { status: 500 })
  }
}
