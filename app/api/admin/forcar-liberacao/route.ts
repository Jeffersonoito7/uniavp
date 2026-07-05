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

  // Busca alunos do tenant para garantir isolamento correto (filtro em join não é confiável)
  let alunoIds: string[] = []
  if (adminRecord.tenant_id) {
    const { data: alunos } = await adminClient.from('alunos')
      .select('id').eq('tenant_id', adminRecord.tenant_id)
    alunoIds = (alunos ?? []).map(a => a.id)
    if (alunoIds.length === 0) return NextResponse.json({ aguardando: [] })
  }

  let q = adminClient.from('progresso')
    .select('id, aluno_id, aula_id, proxima_aula_liberada_em, created_at, aluno:alunos(nome, whatsapp), aula:aulas(id, titulo, ordem, modulo_id, modulo:modulos(id, titulo))')
    .eq('aprovado', true)
    .eq('pendente_liberacao', false)
    .not('proxima_aula_liberada_em', 'is', null)
    .gt('proxima_aula_liberada_em', new Date().toISOString())
    .order('proxima_aula_liberada_em', { ascending: true })

  if (alunoIds.length > 0) {
    q = q.in('aluno_id', alunoIds)
  }

  const { data: aguardando } = await q

  // Para cada registro, busca o título da próxima aula a ser desbloqueada
  const registros = (aguardando ?? []).filter(r => r.aluno !== null)

  // Enriquece com próxima aula (aula com ordem > atual, mesmo módulo)
  const enriquecidos = await Promise.all(registros.map(async (r) => {
    const aulaAtual = r.aula as { id: string; titulo: string; ordem: number; modulo_id: string; modulo: { id: string; titulo: string } | null } | null
    let proxima_aula_titulo: string | null = null
    if (aulaAtual?.modulo_id && aulaAtual?.ordem != null) {
      const { data: proxima } = await adminClient.from('aulas')
        .select('titulo')
        .eq('modulo_id', aulaAtual.modulo_id)
        .eq('publicado', true)
        .gt('ordem', aulaAtual.ordem)
        .order('ordem', { ascending: true })
        .limit(1)
        .maybeSingle()
      proxima_aula_titulo = proxima?.titulo ?? null
    }
    return { ...r, proxima_aula_titulo }
  }))

  return NextResponse.json({ aguardando: enriquecidos })
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
