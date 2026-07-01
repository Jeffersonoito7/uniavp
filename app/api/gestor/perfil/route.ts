import { traduzirErro } from '@/lib/erros'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: gestor } = await adminClient.from('gestores')
    .select('id').eq('user_id', user.id).maybeSingle()
  if (!gestor) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const { nome, link_externo, cpf } = await req.json()

  const updates: { nome?: string; link_externo?: string | null; cpf?: string | null } = {}
  if (nome !== undefined) updates.nome = nome
  if (link_externo !== undefined) updates.link_externo = link_externo || null
  if (cpf !== undefined) updates.cpf = cpf?.replace(/\D/g, '') || null

  const { error } = await adminClient.from('gestores').update(updates as any).eq('id', gestor.id)
  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 400 })

  // Sincroniza CPF para aluno se o gestor tiver um registro FREE sem CPF
  if (updates.cpf) {
    await adminClient.from('alunos')
      .update({ cpf: updates.cpf })
      .eq('user_id', user.id)
      .is('cpf', null)
  }

  return NextResponse.json({ ok: true })
}
