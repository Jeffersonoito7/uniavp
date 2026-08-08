export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

// GET /api/admin/diagnostico?nome=Pablo
// Retorna dados brutos do aluno e do gestor para diagnosticar PRO nao aparecendo
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'nao autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const [{ data: adminRec }, { data: superRec }] = await Promise.all([
    adminClient.from('admins').select('tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
    adminClient.from('super_admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
  ])
  if (!adminRec && !superRec) return NextResponse.json({ error: 'sem permissao' }, { status: 403 })

  const tid = adminRec?.tenant_id ?? null
  const { searchParams } = new URL(req.url)
  const nome = searchParams.get('nome') ?? ''
  if (!nome) return NextResponse.json({ error: 'passe ?nome=parte_do_nome' }, { status: 400 })

  // Buscar aluno
  let alunoQ = adminClient.from('alunos')
    .select('id, nome, email, whatsapp, status, user_id, created_at')
    .ilike('nome', `%${nome}%`)
    .limit(5)
  if (tid) alunoQ = (alunoQ as any).eq('tenant_id', tid)
  const { data: alunos } = await alunoQ

  const resultados = []

  for (const aluno of alunos ?? []) {
    // Buscar gestor pelo email exato (case insensitive)
    let gestorEmailQ = adminClient.from('gestores')
      .select('id, nome, email, whatsapp, ativo, status_assinatura, plano_vencimento, user_id')
      .ilike('email', aluno.email ?? '')
    if (tid) gestorEmailQ = (gestorEmailQ as any).eq('tenant_id', tid)
    const { data: gestorPorEmail } = await gestorEmailQ

    // Buscar gestor pelo user_id
    let gestorUserQ = aluno.user_id
      ? adminClient.from('gestores')
          .select('id, nome, email, whatsapp, ativo, status_assinatura, plano_vencimento, user_id')
          .eq('user_id', aluno.user_id)
      : null
    if (gestorUserQ && tid) gestorUserQ = (gestorUserQ as any).eq('tenant_id', tid)
    const { data: gestorPorUserId } = gestorUserQ ? await gestorUserQ : { data: null }

    // Buscar pagamentos
    const gestorIds = [...(gestorPorEmail ?? []), ...(gestorPorUserId ?? [])].map((g: any) => g.id)
    const { data: pagamentos } = gestorIds.length
      ? await adminClient.from('gestor_pagamentos')
          .select('id, status, tipo, valor, pago_em, created_at, txid')
          .in('gestor_id', gestorIds)
          .order('created_at', { ascending: false })
          .limit(5)
      : { data: [] }

    // Checar se email bate exato (case sensitive) — causa comum de nao detectar PRO
    const emailAlunoOriginal = aluno.email ?? ''
    const emailGestorOriginal = (gestorPorEmail?.[0] as any)?.email ?? ''
    const emailBateExato = emailAlunoOriginal === emailGestorOriginal
    const emailBateIcase = emailAlunoOriginal.toLowerCase() === emailGestorOriginal.toLowerCase()

    // Aluno aparece na query da tela de alunos? (limite 200, ordem created_at desc)
    let posicaoQ = adminClient.from('alunos')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(200)
    if (tid) posicaoQ = (posicaoQ as any).eq('tenant_id', tid)
    const { data: top200 } = await posicaoQ
    const dentroDoLimite200 = (top200 ?? []).some((a: any) => a.id === aluno.id)

    resultados.push({
      aluno: { id: aluno.id, nome: aluno.nome, email: aluno.email, whatsapp: aluno.whatsapp, status: aluno.status, user_id: aluno.user_id, created_at: aluno.created_at },
      gestor_por_email: gestorPorEmail,
      gestor_por_user_id: gestorPorUserId,
      pagamentos,
      diagnostico: {
        tem_gestor_ativo_por_email: (gestorPorEmail ?? []).some((g: any) => g.ativo),
        tem_gestor_ativo_por_user_id: (gestorPorUserId ?? [])?.some((g: any) => g.ativo),
        email_bate_exato: emailBateExato,
        email_bate_case_insensitive: emailBateIcase,
        email_diverge_em_case: !emailBateExato && emailBateIcase,
        aluno_dentro_do_limite_200: dentroDoLimite200,
        pagamento_confirmado: (pagamentos ?? []).some((p: any) => p.status === 'pago'),
      },
    })
  }

  return NextResponse.json({ resultados })
}
