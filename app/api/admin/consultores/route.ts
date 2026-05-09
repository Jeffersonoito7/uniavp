import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

async function verificarAdmin(adminClient: ReturnType<typeof createServiceRoleClient>, userId: string) {
  const { data } = await (adminClient.from('admins') as any)
    .select('id').eq('user_id', userId).eq('ativo', true).maybeSingle()
  return !!data
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  if (!await verificarAdmin(adminClient, user.id)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  // Busca o user_id do aluno
  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('user_id').eq('id', id).maybeSingle()

  // Remove do banco
  const { error } = await (adminClient.from('alunos') as any).delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Remove da autenticação
  if (aluno?.user_id) {
    await adminClient.auth.admin.deleteUser(aluno.user_id).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
