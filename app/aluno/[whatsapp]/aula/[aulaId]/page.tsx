import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import Link from 'next/link'
import Comentarios from './Comentarios'
import CountdownAoVivo from './CountdownAoVivo'

export default async function AulaPage({ params }: { params: { whatsapp: string; aulaId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createServiceRoleClient()
  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!aluno) redirect('/login')
  if (aluno.whatsapp !== params.whatsapp) redirect(`/aluno/${aluno.whatsapp}`)

  const { data: aula } = await (adminClient.from('aulas') as any)
    .select('*, modulo:modulos(titulo)')
    .eq('id', params.aulaId)
    .single()
  if (!aula || !aula.publicado) redirect(`/aluno/${params.whatsapp}`)

  const agora = new Date()
  const temAoVivo = aula.ao_vivo_link && aula.ao_vivo_data
  const aoVivoData = aula.ao_vivo_data ? new Date(aula.ao_vivo_data) : null
  const TRINTA_MIN = 30 * 60 * 1000
  const aoVivoPode = aoVivoData && (agora.getTime() - aoVivoData.getTime()) <= TRINTA_MIN
  const aoVivoPassou = aoVivoData && (agora.getTime() - aoVivoData.getTime()) > TRINTA_MIN

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ background: 'var(--avp-card)', borderBottom: '1px solid var(--avp-border)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={`/aluno/${params.whatsapp}`} style={{ color: 'var(--avp-text-dim)', fontSize: 14, textDecoration: 'none' }}>
          ← {aula.modulo?.titulo ?? 'Módulo'}
        </Link>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--avp-text-dim)' }}>{aula.titulo}</span>
        <div />
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{aula.titulo}</h1>
        {aula.descricao && <p style={{ color: 'var(--avp-text-dim)', fontSize: 15, marginBottom: 24 }}>{aula.descricao}</p>}

        {temAoVivo && (
          <CountdownAoVivo
            aoVivoData={aula.ao_vivo_data}
            aoVivoLink={aula.ao_vivo_link}
            plataforma={aula.ao_vivo_plataforma ?? 'outro'}
          />
        )}

        {(!temAoVivo || aoVivoPassou) && (
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
            <iframe
              src={`https://www.youtube.com/embed/${aula.youtube_video_id}`}
              title={aula.titulo}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        )}

        <Comentarios aulaId={aula.id} alunoId={aluno.id} alunoNome={aluno.nome} />
      </div>
    </div>
  )
}
