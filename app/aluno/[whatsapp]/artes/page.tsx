import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import Link from 'next/link'
import ArtesCliente from './ArtesCliente'
import ThemeToggle from '@/app/components/ThemeToggle'
import EventosWidget from '@/app/components/EventosWidget'

export default async function ArtesPage({ params }: { params: { whatsapp: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createServiceRoleClient()
  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp').eq('user_id', user.id).maybeSingle()
  if (!aluno) redirect('/login')
  if (aluno.whatsapp !== params.whatsapp) redirect(`/aluno/${aluno.whatsapp}/artes`)

  const { data: templates } = await (adminClient.from('artes_templates') as any)
    .select('*').eq('ativo', true).neq('arte_url', '').order('created_at')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ background: 'var(--avp-card)', borderBottom: '1px solid var(--avp-border)', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={`/aluno/${params.whatsapp}`} style={{ fontWeight: 800, fontSize: 20, background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
          Uni AVP
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <EventosWidget />
          <ThemeToggle />
        </div>
      </header>
      {(templates ?? []).length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--avp-text-dim)' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🎨</p>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Artes em breve!</p>
          <p>O administrador ainda não configurou os templates de arte.</p>
        </div>
      ) : (
        <ArtesCliente templates={templates ?? []} nomeAluno={aluno.nome} />
      )}
    </div>
  )
}
