import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { vencimentoMeses } from '@/lib/date-utils'
import AdminLayout from '../AdminLayout'

export const dynamic = 'force-dynamic'

export default async function RepararPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar?p=adm')

  const adminClient = createServiceRoleClient()

  // Aceita admin de tenant OU super admin
  const [{ data: adminRec }, { data: superRec }] = await Promise.all([
    adminClient.from('admins').select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
    adminClient.from('super_admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
  ])
  if (!adminRec && !superRec) redirect('/entrar?p=adm')

  const tid = adminRec?.tenant_id ?? null

  // Busca pagamentos marcados como pago cujo gestor ainda está inativo
  let pagQuery = adminClient.from('gestor_pagamentos')
    .select('id, gestor_id, valor, plano_meses, pago_em, txid')
    .eq('status', 'pago')
    .order('pago_em', { ascending: false })
    .limit(50)

  const { data: pagamentos } = await pagQuery

  const gestorIds = (pagamentos ?? []).map((p: any) => p.gestor_id)

  let gestoresInativos: any[] = []
  if (gestorIds.length > 0) {
    let gq = adminClient.from('gestores')
      .select('id, nome, whatsapp, ativo, status_assinatura, tenant_id, plano_vencimento')
      .in('id', gestorIds)
      .eq('ativo', false)
    if (tid) gq = gq.eq('tenant_id', tid)
    const { data } = await gq
    gestoresInativos = data ?? []
  }

  // Ativa os gestores presos
  const reparados: string[] = []
  const erros: string[] = []

  for (const gestor of gestoresInativos) {
    const pag = (pagamentos ?? []).find((p: any) => p.gestor_id === gestor.id)
    if (!pag) continue
    const vencimento = vencimentoMeses(pag.plano_meses ?? 1)
    const { error } = await adminClient.from('gestores')
      .update({ ativo: true, status_assinatura: 'ativo', plano_vencimento: vencimento, pix_txid: null })
      .eq('id', gestor.id)
    if (error) {
      erros.push(`${gestor.nome}: ${error.message}`)
    } else {
      reparados.push(`${gestor.nome} (${gestor.whatsapp})`)
    }
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 600 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Reparar Pagamentos</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginBottom: 28 }}>
          Verifica e ativa PROs que pagaram mas nao migraram por falha tecnica.
        </p>

        {reparados.length > 0 ? (
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
            <p style={{ color: '#4ade80', fontWeight: 800, fontSize: 16, marginBottom: 12 }}>
              {reparados.length} conta{reparados.length > 1 ? 's reparadas' : ' reparada'}
            </p>
            {reparados.map((r, i) => (
              <p key={i} style={{ color: '#4ade80', fontSize: 14, margin: '4px 0' }}>✓ {r}</p>
            ))}
          </div>
        ) : (
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 15 }}>
              Nenhum pagamento confirmado com gestor inativo encontrado.
            </p>
          </div>
        )}

        {erros.length > 0 && (
          <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
            <p style={{ color: '#f87171', fontWeight: 700, marginBottom: 8 }}>Erros:</p>
            {erros.map((e, i) => (
              <p key={i} style={{ color: '#f87171', fontSize: 14, margin: '4px 0' }}>{e}</p>
            ))}
          </div>
        )}

        <a href="/admin/reparar" style={{ display: 'inline-block', background: '#f59e0b', color: '#000', borderRadius: 8, padding: '10px 24px', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
          Verificar novamente
        </a>
        {' '}
        <a href="/admin" style={{ display: 'inline-block', color: 'var(--avp-text-dim)', fontSize: 14, textDecoration: 'underline', marginLeft: 12 }}>
          Voltar ao admin
        </a>
      </div>
    </AdminLayout>
  )
}
