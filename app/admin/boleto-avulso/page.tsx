export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import BoletoAvulsoCliente from './BoletoAvulsoCliente'

export default async function BoletoAvulsoPage() {
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

  // Carrega alunos para o autocomplete (nome + cpf + whatsapp + email)
  let qAlunos = (adminClient.from('alunos') as any)
    .select('id, nome, cpf, whatsapp, email')
    .order('nome', { ascending: true })
    .limit(500)
  if (tid) qAlunos = qAlunos.eq('tenant_id', tid)
  const { data: alunos } = await qAlunos

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>Boleto Avulso</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>
          Gere um boleto personalizado para qualquer aluno ou pessoa.
        </p>
      </div>
      <BoletoAvulsoCliente alunos={(alunos ?? []) as { id: string; nome: string; cpf: string | null; whatsapp: string; email: string }[]} />
    </>
  )
}
