import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function VerFreePage() {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) redirect('/entrar?p=adm')

 const adminClient = createServiceRoleClient()
 const { data: adminRecord } = await adminClient.from('admins')
 .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
 if (!adminRecord) redirect('/entrar?p=adm')

 // Busca user_ids dos gestores ativos para excluir da lista FREE
 const { data: gestoresAtivos } = await adminClient.from('gestores')
 .select('user_id').eq('ativo', true)
 const userIdsPro = new Set((gestoresAtivos ?? []).map((g: any) => g.user_id).filter(Boolean))

 const { data: alunosRaw } = await adminClient.from('alunos')
 .select('id, nome, whatsapp, status, gestor_nome, user_id')
 .order('nome')
 .limit(200)

 // Filtra apenas FREE (quem não tem gestor ativo)
 const alunos = (alunosRaw ?? []).filter((a: any) => !userIdsPro.has(a.user_id))

 const statusCor: Record<string, string> = {
 ativo: '#02A153', concluido: '#6366f1', pausado: '#6366f1', desligado: '#e63946',
 }

 return (
 <AdminLayout>
 <div style={{ marginBottom: 24 }}>
 <h1 style={{ fontSize: 22, fontWeight: 800 }}>Ver Painel FREE</h1>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>
 Selecione um aluno para abrir o painel FREE como ele vê.
 </p>
 </div>

 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
 {(alunos ?? []).map((a: any) => (
 <div key={a.id} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
 <div>
 <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{a.nome}</p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>
 {a.whatsapp}
 {a.gestor_nome && <> · PRO: {a.gestor_nome}</>}
 {' '}·{' '}
 <span style={{ color: statusCor[a.status] ?? 'var(--avp-text-dim)', fontWeight: 600 }}>{a.status}</span>
 </p>
 </div>
 <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
 <a
 href={`/aluno/${a.whatsapp}?preview=1`}
 target="_blank"
 rel="noopener noreferrer"
 style={{ background: 'var(--grad-brand)', color: '#fff', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}
>
 Entrar como
 </a>
 </div>
 </div>
 ))}
 {(!alunos || alunos.length === 0) && (
 <p style={{ color: 'var(--avp-text-dim)', textAlign: 'center', padding: 40 }}>Nenhum aluno cadastrado ainda.</p>
 )}
 </div>
 </AdminLayout>
 )
}
