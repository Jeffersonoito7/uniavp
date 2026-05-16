import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: gestor } = await (adminClient.from('gestores') as any)
    .select('id, whatsapp')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .maybeSingle()
  if (!gestor) return NextResponse.json({ error: 'Gestor não encontrado' }, { status: 403 })

  const { alunoId } = await req.json()

  // Verifica se o consultor pertence a este gestor
  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('id, gestor_whatsapp')
    .eq('id', alunoId)
    .maybeSingle()

  if (!aluno || aluno.gestor_whatsapp !== gestor.whatsapp) {
    return NextResponse.json({ error: 'Consultor não encontrado' }, { status: 404 })
  }

  // Remove a associação com o gestor (não deleta o aluno)
  await (adminClient.from('alunos') as any)
    .update({ gestor_whatsapp: null, gestor_nome: null })
    .eq('id', alunoId)

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: gestor } = await (adminClient.from('gestores') as any)
    .select('id, whatsapp')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .maybeSingle()
  if (!gestor) return NextResponse.json({ error: 'Gestor não encontrado' }, { status: 403 })

  const { alunoId, status } = await req.json()
  if (!['ativo', 'pausado'].includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('id, gestor_whatsapp')
    .eq('id', alunoId)
    .maybeSingle()
  if (!aluno || aluno.gestor_whatsapp !== gestor.whatsapp) {
    return NextResponse.json({ error: 'Consultor não encontrado' }, { status: 404 })
  }

  await (adminClient.from('alunos') as any)
    .update({ status })
    .eq('id', alunoId)

  return NextResponse.json({ ok: true, status })
}
