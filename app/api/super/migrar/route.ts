import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

type Migration = { id: string; descricao: string; aplicada: boolean }

async function checarMigrations(admin: ReturnType<typeof createServiceRoleClient>): Promise<Migration[]> {
  const lista: Migration[] = []

  const { error: e1 } = await (admin.from('otp_whatsapp') as any).select('id').limit(1)
  lista.push({ id: '0031_otp_whatsapp', descricao: 'OTP WhatsApp', aplicada: !e1 })

  const { data: d2 } = await (admin.from('gestores') as any).select('indicado_por_gestor_id').limit(1)
  lista.push({ id: '0032_gestor_indicado_por', descricao: 'PRO gratuito por rede', aplicada: d2 !== null })

  const { error: e3 } = await (admin.from('pro_registros') as any).select('id').limit(1)
  lista.push({ id: '0033_pro_assistente', descricao: 'Assistente PRO WhatsApp', aplicada: !e3 })

  return lista
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createServiceRoleClient()
  const { data: sa } = await (admin.from('super_admins') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!sa) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const migrations = await checarMigrations(admin)
  return NextResponse.json({ migrations })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createServiceRoleClient()
  const { data: sa } = await (admin.from('super_admins') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!sa) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const id: string = body.id

  return NextResponse.json({ ok: false, error: 'Use o SQL direto no Supabase para esta migration: ' + id })
}
