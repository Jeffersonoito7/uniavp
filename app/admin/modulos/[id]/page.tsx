import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../../AdminLayout'
import AulasCliente from './AulasCliente'
import Link from 'next/link'

export default async function ModuloDetalhePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/aluno')

  const { data: modulo } = await (adminClient.from('modulos') as any).select('*').eq('id', params.id).single()
  if (!modulo) redirect('/admin/modulos')

  const { data: aulas } = await (adminClient.from('aulas') as any).select('*').eq('modulo_id', params.id).order('ordem')

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin/modulos" style={{ color: 'var(--avp-text-dim)', fontSize: 14, textDecoration: 'none' }}>← Módulos</Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)', marginTop: 8 }}>{modulo.titulo}</h1>
        {modulo.descricao && <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>{modulo.descricao}</p>}
      </div>
      <AulasCliente moduloId={params.id} aulasIniciais={aulas ?? []} />
    </AdminLayout>
  )
}
