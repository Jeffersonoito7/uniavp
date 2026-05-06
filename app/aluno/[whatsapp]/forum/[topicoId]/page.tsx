import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import Link from 'next/link'
import TopicoCliente from './TopicoCliente'

export default async function TopicoPage({ params }: { params: { whatsapp: string; topicoId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createServiceRoleClient()
  const { data: aluno } = await (adminClient.from('alunos') as any).select('id, nome, whatsapp').eq('user_id', user.id).maybeSingle()
  if (!aluno) redirect('/login')
  if (aluno.whatsapp !== params.whatsapp) redirect(`/aluno/${aluno.whatsapp}/forum`)

  const { data: topico } = await (adminClient.from('forum_topicos') as any)
    .select('*, aluno:alunos(nome)')
    .eq('id', params.topicoId)
    .single()
  if (!topico) redirect(`/aluno/${params.whatsapp}/forum`)

  const { data: respostas } = await (adminClient.from('forum_respostas') as any)
    .select('*, aluno:alunos(nome)')
    .eq('topico_id', params.topicoId)
    .order('created_at')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ background: 'var(--avp-card)', borderBottom: '1px solid var(--avp-border)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={`/aluno/${params.whatsapp}/forum`} style={{ color: 'var(--avp-text-dim)', fontSize: 14, textDecoration: 'none' }}>← Fórum</Link>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--avp-text-dim)' }}>Tópico</span>
        <div />
      </header>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, padding: 24, marginBottom: 28 }}>
          {topico.fixado && <span style={{ fontSize: 18, marginRight: 8 }}>📌</span>}
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>{topico.titulo}</h1>
          {topico.descricao && <p style={{ color: 'var(--avp-text-dim)', fontSize: 15, lineHeight: 1.6, marginBottom: 12 }}>{topico.descricao}</p>}
          <div style={{ display: 'flex', gap: 12, color: 'var(--avp-text-dim)', fontSize: 13 }}>
            <span>Por: {topico.aluno?.nome ?? 'Aluno'}</span>
            <span>{new Date(topico.created_at).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
        <TopicoCliente topicoId={params.topicoId} respostasIniciais={respostas ?? []} />
      </div>
    </div>
  )
}
