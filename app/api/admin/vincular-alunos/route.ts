import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'

export const dynamic = 'force-dynamic'

// GET: lista alunos sem gestor do tenant + gestores disponiveis
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const tid = ctx.tenantId ?? null

  // Alunos sem gestor_whatsapp (ou vazio) no tenant
  let q = adminClient.from('alunos')
    .select('id, nome, whatsapp, email, gestor_whatsapp, gestor_nome, created_at')
    .or('gestor_whatsapp.is.null,gestor_whatsapp.eq.')
    .order('created_at', { ascending: false })
    .limit(200)

  if (tid) q = q.eq('tenant_id', tid)

  const { data: semGestor } = await q

  // Gestores do tenant para o admin escolher
  let gq = adminClient.from('gestores')
    .select('id, nome, whatsapp, ativo, status_assinatura')
    .order('nome')
  if (tid) gq = gq.eq('tenant_id', tid)
  const { data: gestores } = await gq

  return NextResponse.json({ semGestor: semGestor ?? [], gestores: gestores ?? [] })
}

// POST: vincula os alunos selecionados a um gestor
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { gestor_id, aluno_ids } = await req.json()
  if (!gestor_id || !Array.isArray(aluno_ids) || aluno_ids.length === 0) {
    return NextResponse.json({ error: 'Selecione um gestor e pelo menos um aluno.' }, { status: 400 })
  }

  const { data: gestor } = await adminClient.from('gestores')
    .select('id, nome, whatsapp, tenant_id')
    .eq('id', gestor_id)
    .maybeSingle()

  if (!gestor) return NextResponse.json({ error: 'Gestor não encontrado.' }, { status: 404 })

  // Admin de tenant so pode vincular alunos do seu tenant
  if (ctx.tenantId && gestor.tenant_id !== ctx.tenantId) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  let updateQ = adminClient.from('alunos')
    .update({ gestor_nome: gestor.nome, gestor_whatsapp: gestor.whatsapp })
    .in('id', aluno_ids)
  if (ctx.tenantId) updateQ = (updateQ as any).eq('tenant_id', ctx.tenantId)
  const { error } = await updateQ

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, vinculados: aluno_ids.length, gestorNome: gestor.nome })
}
