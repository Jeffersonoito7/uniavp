import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { aluno_id, nome, bio } = await req.json()

  if (!aluno_id) return NextResponse.json({ error: 'aluno_id obrigatório' }, { status: 400 })

  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('id, user_id')
    .eq('id', aluno_id)
    .maybeSingle()

  if (!aluno || aluno.user_id !== user.id) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { error } = await (adminClient.from('alunos') as any)
    .update({ nome: nome ?? aluno.nome, bio: bio ?? null })
    .eq('id', aluno_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
