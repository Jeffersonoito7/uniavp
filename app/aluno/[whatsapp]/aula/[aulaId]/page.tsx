import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import Link from 'next/link'
import Comentarios from './Comentarios'
import CountdownAoVivo from './CountdownAoVivo'
import CurtidasButton from '@/app/components/CurtidasButton'
import ReacaoAula from './ReacaoAula'

export default async function AulaPage({ params }: { params: { whatsapp: string; aulaId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createServiceRoleClient()
  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp').eq('user_id', user.id).maybeSingle()
  if (!aluno) redirect('/login')
  if (aluno.whatsapp !== params.whatsapp) redirect(`/aluno/${aluno.whatsapp}`)

  const { data: aula } = await (adminClient.from('aulas') as any)
    .select('*, modulo:modulos(titulo)').eq('id', params.aulaId).single()
  if (!aula || !aula.publicado) redirect(`/aluno/${params.whatsapp}`)

  // Curtidas
  const { count: totalCurtidas } = await (adminClient.from('aula_curtidas') as any)
    .select('*', { count: 'exact', head: true }).eq('aula_id', params.aulaId)
  const { data: minhaCurtida } = await (adminClient.from('aula_curtidas') as any)
    .select('id').eq('aula_id', params.aulaId).eq('aluno_id', aluno.id).maybeSingle()

  // Reação
  const { data: minhaReacao } = await (adminClient.from('reacoes_aula') as any)
    .select('id').eq('aula_id', params.aulaId).eq('aluno_id', aluno.id).maybeSingle()

  // Arquivos
  const { data: arquivos } = await (adminClient.from('aula_arquivos') as any)
    .select('*').eq('aula_id', params.aulaId).order('created_at')

  const agora = new Date()
  const temAoVivo = aula.ao_vivo_link && aula.ao_vivo_data
  const aoVivoData = aula.ao_vivo_data ? new Date(aula.ao_vivo_data) : null
  const TRINTA_MIN = 30 * 60 * 1000
  const aoVivoPassou = aoVivoData && (agora.getTime() - aoVivoData.getTime()) > TRINTA_MIN

  const iconeArquivo = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return '📄'
    if (['ppt', 'pptx'].includes(ext ?? '')) return '📊'
    if (['doc', 'docx'].includes(ext ?? '')) return '📝'
    if (['xls', 'xlsx'].includes(ext ?? '')) return '📈'
    return '📎'
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ background: 'var(--avp-card)', borderBottom: '1px solid var(--avp-border)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={`/aluno/${params.whatsapp}`} style={{ color: 'var(--avp-text-dim)', fontSize: 14, textDecoration: 'none' }}>
          ← {aula.modulo?.titulo ?? 'Módulo'}
        </Link>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--avp-text-dim)' }}>{aula.titulo}</span>
        <div />
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{aula.titulo}</h1>
          {aula.descricao && <p style={{ color: 'var(--avp-text-dim)', fontSize: 15 }}>{aula.descricao}</p>}
        </div>

        {temAoVivo && (
          <CountdownAoVivo aoVivoData={aula.ao_vivo_data} aoVivoLink={aula.ao_vivo_link} plataforma={aula.ao_vivo_plataforma ?? 'outro'} />
        )}

        {(!temAoVivo || aoVivoPassou) && (
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 12, overflow: 'hidden' }}>
            <iframe
              src={`https://www.youtube.com/embed/${aula.youtube_video_id}`}
              title={aula.titulo}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        )}

        {/* Curtidas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CurtidasButton
            aulaId={params.aulaId}
            alunoId={aluno.id}
            inicialCurtido={!!minhaCurtida}
            inicialTotal={totalCurtidas ?? 0}
          />
        </div>

        {/* Arquivos para download */}
        {(arquivos ?? []).length > 0 && (
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '20px 24px' }}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>📎 Materiais para Download</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(arquivos ?? []).map((arq: { id: string; nome: string; url: string }) => (
                <a
                  key={arq.id}
                  href={arq.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'var(--avp-black)', border: '1px solid var(--avp-border)',
                    borderRadius: 8, padding: '12px 16px', textDecoration: 'none',
                    color: 'var(--avp-text)', fontSize: 14, fontWeight: 500,
                    transition: 'border-color 0.15s',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{iconeArquivo(arq.url)}</span>
                  <span style={{ flex: 1 }}>{arq.nome}</span>
                  <span style={{ fontSize: 12, color: 'var(--avp-green)', fontWeight: 700 }}>⬇ Baixar</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Pesquisa de reação */}
        <ReacaoAula aulaId={params.aulaId} alunoId={aluno.id} jaReagiu={!!minhaReacao} />

        <Comentarios aulaId={aula.id} alunoId={aluno.id} alunoNome={aluno.nome} />
      </div>
    </div>
  )
}
