import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import Link from 'next/link'
import DisparadorContratos from './DisparadorContratos'

export const dynamic = 'force-dynamic'

export default async function DispararContratosPage() {
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

  // Templates ativos
  let tq = (adminClient.from('contrato_templates' as any) as any)
    .select('id, nome')
    .eq('ativo', true)
    .eq('arquivado', false)
    .order('nome', { ascending: true })
  if (tid) tq = tq.eq('tenant_id', tid)
  const { data: templates } = await tq

  // Alunos ativos
  let aq = adminClient
    .from('alunos')
    .select('id, nome, whatsapp')
    .eq('status', 'ativo')
    .order('nome', { ascending: true })
  if (tid) aq = aq.eq('tenant_id', tid)
  const { data: alunos } = await aq

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <Link
          href="/admin/contratos"
          style={{ color: 'var(--avp-text-dim)', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8 }}
        >
          &larr; Contratos Digitais
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>Disparar Contratos em Massa</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>
          Selecione um template e os alunos para enviar contratos via WhatsApp.
        </p>
      </div>

      <DisparadorContratos
        templates={templates ?? []}
        alunos={alunos ?? []}
      />
    </>
  )
}
