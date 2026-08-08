export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AlunosCliente from './AlunosCliente'

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar?p=adm')

  const adminClient = createServiceRoleClient()
  const [{ data: adminRecord }, { data: superRecord }] = await Promise.all([
    adminClient.from('admins').select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
    adminClient.from('super_admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
  ])
  if (!adminRecord && !superRecord) redirect('/entrar?p=adm')

  const tid = (adminRecord?.tenant_id ?? null) as string | null
  const tq = (q: ReturnType<typeof adminClient.from>) => tid ? (q as any).eq('tenant_id', tid) : q

  const { data: alunosRaw } = await tq(
    adminClient.from('alunos')
      .select('id, nome, whatsapp, email, cpf, status, user_id, created_at, gestor_nome')
      .order('created_at', { ascending: false })
      .limit(200) as any
  )

  // Verificar quais alunos são PRO via email (user_id pode ser null em gestores)
  const emails = ((alunosRaw ?? []) as any[]).filter((a: any) => a.email).map((a: any) => a.email as string)
  const CHUNK = 100
  const gestoresPorEmail: Record<string, { status_assinatura: string; plano_vencimento: string | null }> = {}

  if (emails.length > 0) {
    for (let i = 0; i < emails.length; i += CHUNK) {
      let gq = adminClient
        .from('gestores')
        .select('email, status_assinatura, plano_vencimento')
        .in('email', emails.slice(i, i + CHUNK))
        .eq('ativo', true)
      if (tid) gq = (gq as any).eq('tenant_id', tid)
      const { data } = await gq
      for (const g of data ?? []) gestoresPorEmail[(g as any).email] = g as any
    }
  }

  const alunos = ((alunosRaw ?? []) as any[]).map((a: any) => ({
    id: a.id as string,
    nome: a.nome as string,
    whatsapp: a.whatsapp as string,
    email: a.email as string,
    cpf: (a.cpf ?? null) as string | null,
    status: a.status as string,
    user_id: (a.user_id ?? null) as string | null,
    created_at: (a.created_at ?? null) as string | null,
    gestor_nome: (a.gestor_nome ?? null) as string | null,
    plano: (gestoresPorEmail[a.email ?? ''] ? 'PRO' : 'Free') as 'PRO' | 'Free',
    plano_vencimento: gestoresPorEmail[a.email ?? '']?.plano_vencimento ?? null,
    status_assinatura: gestoresPorEmail[a.email ?? '']?.status_assinatura ?? null,
  }))

  const sp = await searchParams
  const q = sp?.q?.toLowerCase() ?? ''
  const filtrados = q
    ? alunos.filter(a =>
        a.nome.toLowerCase().includes(q) ||
        a.whatsapp.includes(q) ||
        a.email.toLowerCase().includes(q)
      )
    : alunos

  const totalPro = alunos.filter(a => a.plano === 'PRO').length
  const totalFree = alunos.filter(a => a.plano === 'Free').length

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>Alunos</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>
          {alunos.length} alunos: {totalPro} PRO / {totalFree} Free
        </p>
      </div>
      <AlunosCliente alunos={filtrados} buscaInicial={q} />
    </>
  )
}
