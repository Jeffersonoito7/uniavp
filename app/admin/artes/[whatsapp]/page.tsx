import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import Link from 'next/link'
import ArtesCliente from '@/app/aluno/[whatsapp]/artes/ArtesCliente'

export default async function AdminArtesConsultorPage({ params }: { params: { whatsapp: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/login')

  const { data: consultor } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp, foto_perfil, status')
    .eq('whatsapp', params.whatsapp)
    .maybeSingle()
  if (!consultor) redirect('/admin/consultores')

  const { data: templates } = await (adminClient.from('artes_templates') as any)
    .select('*')
    .eq('ativo', true)
    .neq('arte_url', '')
    .order('created_at')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ background: 'var(--avp-card)', borderBottom: '1px solid var(--avp-border)', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/admin/consultores" style={{ color: 'var(--avp-text-dim)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
          ← Voltar a consultores
        </Link>
        <div style={{ textAlign: 'center' as const }}>
          <p style={{ fontWeight: 800, fontSize: 15, margin: 0 }}>🎨 Gerar Arte</p>
          <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0 }}>{consultor.nome}</p>
        </div>
        <div />
      </header>

      {(templates ?? []).length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--avp-text-dim)' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🎨</p>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Sem templates com arte</p>
          <p>Configure e suba um PNG em <Link href="/admin/artes" style={{ color: 'var(--avp-blue)' }}>Templates de Artes</Link>.</p>
        </div>
      ) : (
        <ArtesCliente
          templates={templates ?? []}
          nomeAluno={consultor.nome}
          fotoInicial={consultor.foto_perfil ?? null}
        />
      )}
    </div>
  )
}
