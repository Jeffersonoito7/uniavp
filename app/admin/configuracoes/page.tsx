import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'
import ConfiguracoesCliente from './ConfiguracoesCliente'
import WhatsAppConectar from '@/app/components/WhatsAppConectar'

export const dynamic = 'force-dynamic'

const DOMINIO_MASTER = 'universidade.oito7digital.com.br'

export default async function ConfiguracoesPage() {
  const headersList = await headers()
  const host = headersList.get('host')?.replace(/:\d+$/, '') ?? ''
  const isMaster = host === DOMINIO_MASTER || host === 'localhost'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar?p=adm')
  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/entrar?p=adm')
  const tid = adminRecord.tenant_id as string | null

  let q = (adminClient.from('configuracoes') as any).select('chave, valor, descricao').order('chave')
  if (tid) q = q.eq('tenant_id', tid)
  const { data: configs } = await q

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>Configurações</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Configurações da plataforma</p>
      </div>
      <ConfiguracoesCliente configs={configs ?? []} isMaster={isMaster} />
      <div style={{ marginTop: 24 }}>
        <WhatsAppConectar />
      </div>
    </AdminLayout>
  )
}
