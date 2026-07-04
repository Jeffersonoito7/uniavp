import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// GET: lista alunos com proxima_aula_liberada_em > NOW() (aguardando tempo, modo automatico)
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await adminClient.from('admins')
    .select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  let q = adminClient.from('progresso')
    .select('id, aluno_id, aula_id, proxima_aula_liberada_em, created_at, aluno:alunos(nome, whatsapp), aula:aulas(titulo, modulo:modulos(titulo))')
    .eq('aprovado', true)
    .eq('pendente_liberacao', false)
    .not('proxima_aula_liberada_em', 'is', null)
    .gt('proxima_aula_liberada_em', new Date().toISOString())
    .order('proxima_aula_liberada_em', { ascending: true })

  if (adminRecord.tenant_id) {
    q = q.eq('aluno.tenant_id', adminRecord.tenant_id)
  }

  const { data: aguardando } = await q
  // Filtra nulos que vieram de join sem match de tenant
  const lista = (aguardando ?? []).filter(r => r.aluno !== null)
  return NextResponse.json({ aguardando: lista })
}

// POST: força liberação imediata de um aluno (zera proxima_aula_liberada_em para agora)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await adminClient.from('admins')
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { progresso_id } = await req.json()
  if (!progresso_id) return NextResponse.json({ error: 'progresso_id obrigatório' }, { status: 400 })

  const { error } = await adminClient.from('progresso')
    .update({ proxima_aula_liberada_em: new Date().toISOString() })
    .eq('id', progresso_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
