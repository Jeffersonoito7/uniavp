import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function verificarAdmin(adminClient: ReturnType<typeof createServiceRoleClient>, userId: string) {
  const { data } = await (adminClient.from('admins') as any)
    .select('id')
    .eq('user_id', userId)
    .eq('ativo', true)
    .maybeSingle()
  return !!data
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const isAdmin = await verificarAdmin(adminClient, user.id)
  if (!isAdmin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const aulaId = req.nextUrl.searchParams.get('aula_id')
  if (!aulaId) return NextResponse.json({ error: 'aula_id obrigatório' }, { status: 400 })

  const { data: questoes, error } = await (adminClient.from('questoes') as any)
    .select('*')
    .eq('aula_id', aulaId)
    .order('ordem')

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ questoes: questoes ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const isAdmin = await verificarAdmin(adminClient, user.id)
  if (!isAdmin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const { aula_id, enunciado, alternativas, explicacao } = body

  if (!aula_id || !enunciado || !alternativas || !Array.isArray(alternativas) || alternativas.length < 2) {
    return NextResponse.json({ error: 'Campos obrigatórios: aula_id, enunciado, alternativas (mínimo 2)' }, { status: 400 })
  }

  const temCorreta = alternativas.some((a: { correta?: boolean }) => a.correta === true)
  if (!temCorreta) {
    return NextResponse.json({ error: 'Pelo menos uma alternativa deve ser marcada como correta' }, { status: 400 })
  }

  const { data: ultima } = await (adminClient.from('questoes') as any)
    .select('ordem')
    .eq('aula_id', aula_id)
    .order('ordem', { ascending: false })
    .limit(1)
    .maybeSingle()

  const ordem = (ultima?.ordem ?? 0) + 1

  const { data: questao, error } = await (adminClient.from('questoes') as any)
    .insert({ aula_id, ordem, enunciado, alternativas, explicacao: explicacao ?? null })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ questao })
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const isAdmin = await verificarAdmin(adminClient, user.id)
  if (!isAdmin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const { id, enunciado, alternativas, explicacao, ativa, ordem } = body

  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (enunciado !== undefined) updates.enunciado = enunciado
  if (alternativas !== undefined) updates.alternativas = alternativas
  if (explicacao !== undefined) updates.explicacao = explicacao
  if (ativa !== undefined) updates.ativa = ativa
  if (ordem !== undefined) updates.ordem = ordem

  const { data: questao, error } = await (adminClient.from('questoes') as any)
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ questao })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const isAdmin = await verificarAdmin(adminClient, user.id)
  if (!isAdmin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const { error } = await (adminClient.from('questoes') as any).delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
