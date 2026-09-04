export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

// GET /api/admin/diagnostico-datas
// Verifica se os campos de data existem e estao preenchidos na tabela alunos
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'nao autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const [{ data: adminRec }, { data: superRec }] = await Promise.all([
    adminClient.from('admins').select('tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
    adminClient.from('super_admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
  ])
  if (!adminRec && !superRec) return NextResponse.json({ error: 'sem permissao' }, { status: 403 })

  const tid = (adminRec?.tenant_id ?? null) as string | null

  // Total de alunos
  let qTotal = adminClient.from('alunos').select('id', { count: 'exact', head: true })
  if (tid) qTotal = (qTotal as any).eq('tenant_id', tid)
  const { count: total } = await qTotal

  // Com created_at preenchido
  let qComData = adminClient.from('alunos').select('id', { count: 'exact', head: true }).not('created_at', 'is', null)
  if (tid) qComData = (qComData as any).eq('tenant_id', tid)
  const { count: comData } = await qComData

  // Com data_formacao preenchido
  let qFormados = adminClient.from('alunos').select('id', { count: 'exact', head: true }).not('data_formacao', 'is', null)
  if (tid) qFormados = (qFormados as any).eq('tenant_id', tid)
  const { count: comFormacao } = await qFormados

  // Amostra dos 5 mais recentes para ver se created_at existe
  let qAmostra = (adminClient.from('alunos') as any)
    .select('id, nome, created_at, data_formacao, status')
    .order('id', { ascending: false })
    .limit(5)
  if (tid) qAmostra = qAmostra.eq('tenant_id', tid)
  const { data: amostra } = await qAmostra

  // Distribuicao por mes (ultimos 6 meses)
  const agora = new Date()
  const seisAtras = new Date(agora.getFullYear(), agora.getMonth() - 5, 1).toISOString()
  let qMeses = (adminClient.from('alunos') as any)
    .select('created_at')
    .gte('created_at', seisAtras)
    .not('created_at', 'is', null)
  if (tid) qMeses = qMeses.eq('tenant_id', tid)
  const { data: mesesRaw } = await qMeses

  const porMes: Record<string, number> = {}
  for (const r of (mesesRaw ?? []) as { created_at: string }[]) {
    const d = new Date(r.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    porMes[key] = (porMes[key] ?? 0) + 1
  }

  return NextResponse.json({
    total: total ?? 0,
    com_created_at: comData ?? 0,
    sem_created_at: (total ?? 0) - (comData ?? 0),
    com_data_formacao: comFormacao ?? 0,
    pct_com_data: total ? Math.round(((comData ?? 0) / total) * 100) : 0,
    cadastros_por_mes_ultimos_6: porMes,
    amostra_5_ultimos: amostra ?? [],
  })
}
