import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import Link from 'next/link'
import ThemeToggle from '@/app/components/ThemeToggle'
import EventosWidget from '@/app/components/EventosWidget'

type TrilhaItem = {
  modulo_id: string
  modulo_ordem: number
  modulo_titulo: string
  aula_id: string
  aula_ordem: number
  aula_titulo: string
  aula_descricao: string | null
  duracao_minutos: number | null
  capa_url: string | null
  youtube_video_id: string
  status: string
  melhor_percentual: number | null
  liberada_em: string | null
  validade_meses?: number | null
  progresso_created_at?: string | null
}

function calcularNivel(pontos: number) {
  if (pontos >= 300) return { nome: 'Especialista', prox: null, atual: pontos, min: 300, max: 300 }
  if (pontos >= 100) return { nome: 'Consultor', prox: 300, atual: pontos, min: 100, max: 300 }
  return { nome: 'Iniciante', prox: 100, atual: pontos, min: 0, max: 100 }
}

export default async function AlunoHomePage({ params }: { params: { whatsapp: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createServiceRoleClient()
  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp, status')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!aluno) redirect('/login')
  if (aluno.whatsapp !== params.whatsapp) redirect(`/aluno/${aluno.whatsapp}`)

  const { data: trilhaRaw } = await (adminClient as any).rpc('obter_trilha_aluno', { p_aluno_id: aluno.id })
  const trilha: TrilhaItem[] = (trilhaRaw ?? []) as TrilhaItem[]

  const agrupado: Record<string, { modulo_titulo: string; modulo_ordem: number; aulas: TrilhaItem[] }> = {}
  for (const item of trilha) {
    if (!agrupado[item.modulo_id]) {
      agrupado[item.modulo_id] = { modulo_titulo: item.modulo_titulo, modulo_ordem: item.modulo_ordem, aulas: [] }
    }
    agrupado[item.modulo_id].aulas.push(item)
  }
  const modulos = Object.values(agrupado).sort((a, b) => a.modulo_ordem - b.modulo_ordem)

  const { data: pontosRows } = await (adminClient.from('aluno_pontos') as any).select('quantidade').eq('aluno_id', aluno.id)
  const totalPontos = (pontosRows ?? []).reduce((s: number, r: { quantidade: number }) => s + r.quantidade, 0)

  const { data: medalhasRows } = await (adminClient.from('aluno_medalhas') as any)
    .select('medalha:medalhas_config(nome, icone)')
    .eq('aluno_id', aluno.id)
  const medalhas = (medalhasRows ?? []).map((r: any) => r.medalha)

  const nivel = calcularNivel(totalPontos)
  const progressoPct = nivel.prox ? Math.round(((nivel.atual - nivel.min) / (nivel.max - nivel.min)) * 100) : 100

  const agora = new Date()

  function getStatusRecertificacao(item: TrilhaItem): boolean {
    if (item.status !== 'concluida') return false
    if (!item.validade_meses || item.validade_meses === 0) return false
    if (!item.progresso_created_at) return false
    const expira = new Date(item.progresso_created_at)
    expira.setMonth(expira.getMonth() + item.validade_meses)
    return agora > expira
  }

  const statusColor: Record<string, string> = {
    concluida: 'var(--avp-green)',
    disponivel: 'var(--avp-blue)',
    aguardando_tempo: '#f59e0b',
    bloqueada: 'var(--avp-text-dim)',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ background: 'var(--avp-card)', borderBottom: '1px solid var(--avp-border)', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 800, fontSize: 20, background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Uni AVP
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href={`/aluno/${params.whatsapp}/forum`} style={{ color: 'var(--avp-text-dim)', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>
            Fórum
          </Link>
          <Link href={`/aluno/${params.whatsapp}/loja`} style={{ color: 'var(--avp-text-dim)', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>
            Loja
          </Link>
          <Link href={`/aluno/${params.whatsapp}/artes`} style={{ color: 'var(--avp-text-dim)', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>
            🎨 Artes
          </Link>
          <EventosWidget />
          <a href={`/aluno/${params.whatsapp}/perfil`} style={{ color: 'var(--avp-text-dim)', fontSize: 13, textDecoration: 'none' }}>
            👤 Meu Perfil
          </a>
          <ThemeToggle />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
              {aluno.nome.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{aluno.nome.split(' ')[0]}</span>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 32 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Olá, {aluno.nome.split(' ')[0]}!</h1>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 16 }}>Continue sua jornada de formação na Uni AVP.</p>
        </div>

        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 24, marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, marginBottom: 20 }}>
            <div>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 4 }}>Nível atual</p>
              <p style={{ fontSize: 24, fontWeight: 800 }}>{nivel.nome}</p>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>
                {totalPontos} pontos{nivel.prox ? ` · próximo nível: ${nivel.prox} pts` : ' · Nível máximo!'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {medalhas.map((m: { icone: string; nome: string }, i: number) => (
                <div key={i} style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{m.icone}</div>
                  <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', fontWeight: 600 }}>{m.nome}</p>
                </div>
              ))}
              {medalhas.length === 0 && (
                <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, alignSelf: 'center' }}>Complete aulas para ganhar medalhas!</p>
              )}
            </div>
          </div>
          <div style={{ background: 'var(--avp-black)', borderRadius: 100, height: 8, overflow: 'hidden' }}>
            <div style={{ width: `${progressoPct}%`, height: '100%', background: 'var(--grad-brand)', borderRadius: 100, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--avp-text-dim)' }}>{nivel.nome}</span>
            {nivel.prox && <span style={{ fontSize: 11, color: 'var(--avp-text-dim)' }}>Próximo: {nivel.prox} pts</span>}
          </div>
        </div>

        {modulos.map(mod => (
          <div key={mod.modulo_titulo} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--avp-border)' }}>
              {mod.modulo_titulo}
            </h2>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
              {mod.aulas.map(aula => {
                const recertNeeded = getStatusRecertificacao(aula)
                const isDisponivel = aula.status === 'disponivel'
                const isConcluida = aula.status === 'concluida'
                return (
                  <div
                    key={aula.aula_id}
                    style={{ minWidth: 200, maxWidth: 220, background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, overflow: 'hidden', flex: '0 0 auto', opacity: aula.status === 'bloqueada' ? 0.5 : 1 }}
                  >
                    <div style={{ height: 110, background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                      {isConcluida ? '✅' : isDisponivel ? '▶️' : aula.status === 'aguardando_tempo' ? '⏳' : '🔒'}
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>{aula.aula_titulo}</p>
                      {recertNeeded && (
                        <span style={{ background: '#f59e0b20', color: '#f59e0b', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600, display: 'inline-block', marginBottom: 6 }}>
                          ⚠️ Recertificação necessária
                        </span>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: statusColor[aula.status] || 'var(--avp-text-dim)', fontWeight: 600 }}>
                          {isConcluida ? (recertNeeded ? 'Refazer' : 'Concluída') : aula.status === 'disponivel' ? 'Disponível' : aula.status === 'aguardando_tempo' ? 'Aguardando' : 'Bloqueada'}
                        </span>
                        {(isDisponivel || isConcluida) && (
                          <Link href={`/aluno/${params.whatsapp}/aula/${aula.aula_id}`} style={{ fontSize: 12, color: 'var(--avp-green)', textDecoration: 'none', fontWeight: 600 }}>
                            {isConcluida && !recertNeeded ? 'Rever' : 'Acessar'}
                          </Link>
                        )}
                        {aula.status === 'aguardando_tempo' && aula.liberada_em && (
                          <span style={{ fontSize: 11, color: 'var(--avp-text-dim)' }}>
                            {new Date(aula.liberada_em).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {modulos.length === 0 && (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--avp-text-dim)' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>📚</p>
            <p>Nenhuma aula disponível no momento.</p>
          </div>
        )}
      </div>
    </div>
  )
}
