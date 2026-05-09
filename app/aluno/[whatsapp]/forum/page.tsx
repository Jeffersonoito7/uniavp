import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import Link from 'next/link'
import ForumCliente from './ForumCliente'

export default async function ForumPage({ params }: { params: { whatsapp: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createServiceRoleClient()
  const { data: aluno } = await (adminClient.from('alunos') as any).select('id, nome, whatsapp').eq('user_id', user.id).maybeSingle()
  if (!aluno) redirect('/login')
  if (aluno.whatsapp !== params.whatsapp) redirect(`/aluno/${aluno.whatsapp}/forum`)

  const { data: topicos } = await (adminClient.from('forum_topicos') as any)
    .select('*, aluno:alunos(nome), respostas:forum_respostas(count)')
    .order('fixado', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ background: 'var(--avp-card)', borderBottom: '1px solid var(--avp-border)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={`/aluno/${params.whatsapp}`} style={{ color: 'var(--avp-text-dim)', fontSize: 14, textDecoration: 'none' }}>← Início</Link>
        <span style={{ fontWeight: 800, fontSize: 16 }}>Fórum da Comunidade</span>
        <div />
      </header>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        <ForumCliente topicosIniciais={topicos ?? []} whatsapp={params.whatsapp} alunoId={aluno.id} alunoNome={aluno.nome} />
      </div>
    </div>
  )
}
