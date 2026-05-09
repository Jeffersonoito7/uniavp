import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'
import ConfiguracoesCliente from './ConfiguracoesCliente'
import WhatsAppConectar from '@/app/components/WhatsAppConectar'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/login')

  const { data: configs } = await (adminClient.from('configuracoes') as any).select('chave, valor, descricao').order('chave')

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>Configurações</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Configurações da plataforma</p>
      </div>
      <ConfiguracoesCliente configs={configs ?? []} />
      <div style={{ marginTop: 24 }}>
        <WhatsAppConectar />
      </div>
    </AdminLayout>
  )
}
