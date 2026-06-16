import { traduzirErro } from '@/lib/erros'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function verificarAdmin(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const adminClient = createServiceRoleClient()
  const { data } = await adminClient.from('admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  return data ? adminClient : null
}

export async function GET() {
  const adminClient = createServiceRoleClient()
  const { data } = await adminClient.from('documentos_painel')
    .select('*')
    .order('ordem', { ascending: true })
    .order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const adminClient = await verificarAdmin(req)
  if (!adminClient) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { titulo, descricao, pdf_url, painel, ordem } = await req.json()
  if (!titulo || !pdf_url) return NextResponse.json({ error: 'Título e PDF são obrigatórios' }, { status: 400 })

  const { data, error } = await adminClient.from('documentos_painel')
    .insert({ titulo, descricao: descricao || null, pdf_url, painel: painel || 'ambos', ordem: ordem || 0 })
    .select().single()

  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const adminClient = await verificarAdmin(req)
  if (!adminClient) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id, titulo, descricao, pdf_url, painel, ativo, ordem } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const { data, error } = await adminClient.from('documentos_painel')
    .update({ titulo, descricao, pdf_url, painel, ativo, ordem })
    .eq('id', id)
    .select().single()

  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const adminClient = await verificarAdmin(req)
  if (!adminClient) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const { error } = await adminClient.from('documentos_painel').delete().eq('id', id)
  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 500 })
  return NextResponse.json({ ok: true })
}
