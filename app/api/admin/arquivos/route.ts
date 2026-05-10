import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function getAdmin(user: { id: string }, adminClient: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  return !!data
}

export async function GET(req: NextRequest) {
  const aulaId = req.nextUrl.searchParams.get('aulaId')
  if (!aulaId) return NextResponse.json([])
  const adminClient = createServiceRoleClient()
  const { data } = await (adminClient.from('aula_arquivos') as any).select('*').eq('aula_id', aulaId).order('created_at')
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const adminClient = createServiceRoleClient()
  if (!await getAdmin(user, adminClient)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { aulaId, nome, url } = await req.json()
  const { data, error } = await (adminClient.from('aula_arquivos') as any)
    .insert({ aula_id: aulaId, nome, url }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const adminClient = createServiceRoleClient()
  if (!await getAdmin(user, adminClient)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()
  await (adminClient.from('aula_arquivos') as any).delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
