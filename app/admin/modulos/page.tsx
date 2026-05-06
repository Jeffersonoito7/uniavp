import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'
import Link from 'next/link'

export default async function ModulosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/aluno')

  const { data: modulos } = await (adminClient.from('modulos') as any).select('*, aulas(count)').order('ordem')

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>Módulos</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Gerencie os módulos e aulas da trilha</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(modulos ?? []).map((m: any) => (
          <Link key={m.id} href={`/admin/modulos/${m.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ background: 'var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>Módulo {m.ordem}</span>
                  <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--avp-text)' }}>{m.titulo}</h3>
                </div>
                {m.descricao && <p style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>{m.descricao}</p>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: m.publicado ? 'var(--avp-green)' : 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600 }}>
                  {m.publicado ? 'Publicado' : 'Rascunho'}
                </span>
              </div>
            </div>
          </Link>
        ))}
        {(!modulos || modulos.length === 0) && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--avp-text-dim)' }}>Nenhum módulo cadastrado.</div>
        )}
      </div>
    </AdminLayout>
  )
}
