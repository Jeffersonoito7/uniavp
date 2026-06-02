import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function getAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createServiceRoleClient()
  const { data } = await admin.from('admins').select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  return data ? { user, admin, tenantId: data.tenant_id } : null
}

export async function GET() {
  const ctx = await getAdmin()
  if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { data } = await ctx.admin.from('biblioteca')
    .select('*').eq('tenant_id', ctx.tenantId ?? '').order('ordem').order('created_at', { ascending: false })
  return NextResponse.json({ items: data ?? [] })
}

export async function POST(req: NextRequest) {
  const ctx = await getAdmin()
  if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json()
  const { data, error } = await ctx.admin.from('biblioteca').insert({
    tenant_id: ctx.tenantId,
    titulo: body.titulo,
    autor: body.autor || null,
    descricao: body.descricao || null,
    url: body.url,
    tipo: body.tipo || 'drive',
    capa_url: body.capa_url || null,
    categoria: body.categoria || 'Audiobook',
    plano: body.plano || 'pro',
    duracao: body.duracao || null,
    ordem: body.ordem || 0,
    ativo: true,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ item: data })
}

export async function PUT(req: NextRequest) {
  const ctx = await getAdmin()
  if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json()
  const { id, ...rest } = body
  const { data, error } = await ctx.admin.from('biblioteca')
    .update(rest).eq('id', id).eq('tenant_id', ctx.tenantId ?? '').select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ item: data })
}

export async function DELETE(req: NextRequest) {
  const ctx = await getAdmin()
  if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await req.json()
  await ctx.admin.from('biblioteca').delete().eq('id', id).eq('tenant_id', ctx.tenantId ?? '')
  return NextResponse.json({ ok: true })
}
