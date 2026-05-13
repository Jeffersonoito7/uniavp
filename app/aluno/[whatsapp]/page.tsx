import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getSiteConfig } from '@/lib/site-config'
import Link from 'next/link'
import ThemeToggle from '@/app/components/ThemeToggle'
import EventosWidget from '@/app/components/EventosWidget'
import MuralNoticias from '@/app/components/MuralNoticias'
import LogoutButton from '@/app/components/LogoutButton'
import CertificadoWrapper from '@/app/components/CertificadoWrapper'
import SupportChat from '@/app/components/SupportChat'
import PushButton from '@/app/components/PushButton'
import PWAInstallButton from '@/app/components/PWAInstallButton'
import RankingWidget from '@/app/components/RankingWidget'

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
  quiz_aprovacao_minima?: number | null
}

function calcularNivel(pontos: number) {
  if (pontos >= 300) return { nome: 'Especialista', prox: null, atual: pontos, min: 300, max: 300 }
  if (pontos >= 100) return { nome: 'Consultor', prox: 300, atual: pontos, min: 100, max: 300 }
  return { nome: 'Iniciante', prox: 100, atual: pontos, min: 0, max: 100 }
}

export default async function AlunoHomePage({ params }: { params: { whatsapp: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/consultor/login')

  const [adminClient, siteConfig] = [createServiceRoleClient(), await getSiteConfig()]
  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp, status')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: certConfigs } = await (adminClient.from('configuracoes') as any)
    .select('chave, valor')
    .in('chave', [
      'certificado_template_url', 'certificado_nome_x', 'certificado_nome_y',
      'certificado_nome_tamanho', 'certificado_nome_cor',
      'certificado_cidade', 'certificado_data_x', 'certificado_data_y',
      'certificado_data_tamanho', 'certificado_data_cor',
    ])
  const certMap: Record<string, string> = {}
  for (const r of certConfigs ?? []) { try { certMap[r.chave] = JSON.parse(r.valor) } catch { certMap[r.chave] = r.valor } }
  if (!aluno) redirect('/consultor/login')
  if (aluno.whatsapp !== params.whatsapp) redirect(`/aluno/${aluno.whatsapp}`)

  const { data: trilhaRaw } = await (adminClient as any).rpc('obter_trilha_aluno', { p_aluno_id: aluno.id })
  const trilhaBase: TrilhaItem[] = (trilhaRaw ?? []) as TrilhaItem[]

  // Enriquecer trilha com quiz_aprovacao_minima (não vem na RPC atual)
  const aulaIds = trilhaBase.map(t => t.aula_id)
  const { data: aulasConfig } = aulaIds.length > 0
    ? await (adminClient.from('aulas') as any).select('id, quiz_aprovacao_minima').in('id', aulaIds)
    : { data: [] }
  const aprovMinMap: Record<string, number> = {}
  for (const a of (aulasConfig ?? [])) aprovMinMap[a.id] = a.quiz_aprovacao_minima

  const trilha: TrilhaItem[] = trilhaBase.map(t => ({ ...t, quiz_aprovacao_minima: aprovMinMap[t.aula_id] ?? null }))

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

  const totalAulas = trilha.length
  const aulasConcluidas = trilha.filter(a => a.status === 'concluida').length
  const progressoGeral = totalAulas > 0 ? Math.round((aulasConcluidas / totalAulas) * 100) : 0

  // Aula para "Continue assistindo": primeira disponível em ordem de módulo/aula
  const aulaAtual = trilha
    .slice()
    .sort((a, b) => a.modulo_ordem !== b.modulo_ordem ? a.modulo_ordem - b.modulo_ordem : a.aula_ordem - b.aula_ordem)
    .find(a => a.status === 'disponivel')

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
    concluida: '#22c55e',
    disponivel: '#3b82f6',
    aguardando_tempo: '#f59e0b',
    bloqueada: '#6b7280',
  }

  return (
    <>
      <SupportChat painel="Consultor" />
      <div style={{ minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>

        {/* ── HEADER ── */}
        <header style={{
          background: 'rgba(8,9,13,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--avp-border)',
          padding: '0 20px',
          height: 62,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {siteConfig.logoUrl && !siteConfig.logoUrl.startsWith('/') ? (
              <img src={siteConfig.logoUrl} alt={siteConfig.nome} className="logo-site" style={{ height: 34, objectFit: 'contain' }} />
            ) : (
              <span style={{ fontWeight: 800, fontSize: 17, background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{siteConfig.nome}</span>
            )}
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link href={`/aluno/${params.whatsapp}/forum`} style={{ color: 'var(--avp-text-dim)', fontSize: 13, textDecoration: 'none', fontWeight: 500, padding: '6px 10px', borderRadius: 8, background: 'transparent' }}
              className="hide-mobile">Fórum</Link>
            <Link href={`/aluno/${params.whatsapp}/loja`} style={{ color: 'var(--avp-text-dim)', fontSize: 13, textDecoration: 'none', fontWeight: 500, padding: '6px 10px', borderRadius: 8 }}
              className="hide-mobile">Loja</Link>
            {aluno.status === 'concluido' && (
              <Link href={`/aluno/${params.whatsapp}/carteira`}
                style={{ color: '#fbbf24', fontSize: 13, textDecoration: 'none', fontWeight: 700, padding: '6px 10px', borderRadius: 8, background: '#fbbf2415', border: '1px solid #fbbf2440' }}
                title="Minha Carteira de Formação">🎓 Carteira</Link>
            )}
            <PushButton />
            <PWAInstallButton />
            <MuralNoticias />
            <EventosWidget />
            <a href={`/aluno/${params.whatsapp}/perfil`} style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', marginLeft: 4 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0 }}>
                {aluno.nome.charAt(0).toUpperCase()}
              </div>
              <span className="hide-mobile" style={{ fontSize: 13, fontWeight: 600, color: 'var(--avp-text)' }}>{aluno.nome.split(' ')[0]}</span>
            </a>
            <ThemeToggle />
            <LogoutButton />
          </nav>
        </header>

        <div style={{ maxWidth: 1140, margin: '0 auto', padding: 'clamp(16px, 4vw, 28px) clamp(12px, 4vw, 20px) 60px' }}>

          {/* ── HERO SAUDAÇÃO ── */}
          <div style={{ marginBottom: aulaAtual ? 20 : 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
              Olá, {aluno.nome.split(' ')[0]}! 👋
            </h1>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 15 }}>
              Continue sua jornada de formação em {siteConfig.nome}.
            </p>
          </div>

          {/* ── CONTINUE ASSISTINDO ── */}
          {aulaAtual && (
            <div style={{
              marginBottom: 28,
              background: 'linear-gradient(135deg, rgba(30,58,138,0.6) 0%, rgba(17,24,39,0.9) 100%)',
              border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 16,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'row',
              minHeight: 140,
            }}>
              {/* Thumbnail */}
              <div style={{ width: 220, flexShrink: 0, position: 'relative', background: 'linear-gradient(135deg, #1e3a8a, #1e40af)', overflow: 'hidden' }}
                className="hide-mobile">
                {(aulaAtual.capa_url || aulaAtual.youtube_video_id) && (
                  <img
                    src={aulaAtual.capa_url || `https://img.youtube.com/vi/${aulaAtual.youtube_video_id}/mqdefault.jpg`}
                    alt={aulaAtual.aula_titulo}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                  />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#1e3a8a' }}>▶</div>
                </div>
              </div>

              {/* Info */}
              <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                    ▶ Continue assistindo
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>{aulaAtual.modulo_titulo}</span>
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.3, margin: 0 }}>
                  {aulaAtual.aula_titulo}
                </h2>
                {aulaAtual.aula_descricao && (
                  <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {aulaAtual.aula_descricao}
                  </p>
                )}
                <div style={{ marginTop: 4 }}>
                  <Link href={`/aluno/${params.whatsapp}/aula/${aulaAtual.aula_id}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                      color: '#fff', textDecoration: 'none', borderRadius: 10,
                      padding: '10px 22px', fontWeight: 700, fontSize: 14,
                      boxShadow: '0 4px 16px rgba(59,130,246,0.4)',
                    }}>
                    ▶ Continuar agora
                  </Link>
                  {aulaAtual.duracao_minutos && (
                    <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--avp-text-dim)' }}>
                      ⏱ {aulaAtual.duracao_minutos} min
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── CARDS DE STATS + PROGRESSO ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
            {/* Card nível */}
            <div style={{ background: 'linear-gradient(135deg, #1e3a8a20, #3b82f610)', border: '1px solid #3b82f630', borderRadius: 14, padding: 20 }}>
              <p style={{ color: '#93c5fd', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Nível</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{nivel.nome}</p>
              <p style={{ color: '#93c5fd', fontSize: 12 }}>{totalPontos} pts{nivel.prox ? ` · próximo: ${nivel.prox}` : ' · Máximo!'}</p>
              <div style={{ marginTop: 10, background: 'rgba(59,130,246,0.15)', borderRadius: 100, height: 5, overflow: 'hidden' }}>
                <div style={{ width: `${progressoPct}%`, height: '100%', background: 'linear-gradient(90deg, #1e40af, #3b82f6)', borderRadius: 100 }} />
              </div>
            </div>

            {/* Card progresso geral */}
            <div style={{ background: 'linear-gradient(135deg, #05260e20, #02A15310)', border: '1px solid #02A15330', borderRadius: 14, padding: 20 }}>
              <p style={{ color: '#6ee7b7', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Progresso Geral</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{progressoGeral}%</p>
              <p style={{ color: '#6ee7b7', fontSize: 12 }}>{aulasConcluidas} de {totalAulas} aulas concluídas</p>
              <div style={{ marginTop: 10, background: 'rgba(2,161,83,0.15)', borderRadius: 100, height: 5, overflow: 'hidden' }}>
                <div style={{ width: `${progressoGeral}%`, height: '100%', background: 'linear-gradient(90deg, #059669, #02A153)', borderRadius: 100 }} />
              </div>
            </div>

            {/* Medalhas */}
            <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, padding: 20 }}>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Medalhas</p>
              {medalhas.length > 0 ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {medalhas.map((m: { icone: string; nome: string }, i: number) => (
                    <div key={i} title={m.nome} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--avp-black)', border: '1px solid var(--avp-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {m.icone}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>Complete aulas para ganhar medalhas!</p>
              )}
            </div>

            {/* Atalhos mobile */}
            <div className="hide-desktop" style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, padding: 20 }}>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Acessar</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { href: `/aluno/${params.whatsapp}/forum`, label: '💬 Fórum' },
                  { href: `/aluno/${params.whatsapp}/loja`, label: '🛍️ Loja' },
                  { href: `/aluno/${params.whatsapp}/perfil`, label: '👤 Perfil' },
                  ...(aluno.status === 'concluido' ? [{ href: `/aluno/${params.whatsapp}/carteira`, label: '🎓 Carteira' }] : []),
                ].map(l => (
                  <a key={l.href} href={l.href} style={{ color: 'var(--avp-text)', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>{l.label}</a>
                ))}
              </div>
            </div>
          </div>

          {/* ── BANNER DE FORMAÇÃO ── */}
          {aluno.status === 'concluido' && (
            <div style={{ background: 'linear-gradient(135deg, #1a1a3e, #2d1b69)', border: '1px solid #6366f140', borderRadius: 16, padding: '24px 28px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 52, flexShrink: 0 }}>🎓</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 900, fontSize: 18, color: '#fff', margin: '0 0 4px' }}>Parabéns, {aluno.nome.split(' ')[0]}! Você é um Consultor Certificado!</p>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, margin: 0 }}>Você concluiu 100% da formação. Acesse seus documentos abaixo.</p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link href={`/aluno/${params.whatsapp}/carteira`}
                  style={{ background: '#fbbf24', color: '#1a1a1a', borderRadius: 10, padding: '10px 20px', fontWeight: 800, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  🪪 Carteira
                </Link>
              </div>
            </div>
          )}

          {/* ── TRILHA DE AULAS ── */}
          {modulos.map(mod => (
            <div key={mod.modulo_titulo} style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--avp-border)' }}>
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>{mod.modulo_titulo}</h2>
                <span style={{ fontSize: 12, color: 'var(--avp-text-dim)', background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 20, padding: '2px 10px' }}>
                  {mod.aulas.filter(a => a.status === 'concluida').length}/{mod.aulas.length} aulas
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                {mod.aulas.map(aula => {
                  const recertNeeded = getStatusRecertificacao(aula)
                  const isDisponivel = aula.status === 'disponivel'
                  const isConcluida = aula.status === 'concluida'
                  const isBloqueada = aula.status === 'bloqueada'
                  const cor = statusColor[aula.status] || '#6b7280'
                  return (
                    <div key={aula.aula_id} style={{
                      background: 'var(--avp-card)',
                      border: `1px solid ${isConcluida ? '#22c55e30' : isDisponivel ? '#3b82f630' : 'var(--avp-border)'}`,
                      borderRadius: 12, overflow: 'hidden',
                      opacity: isBloqueada ? 0.55 : 1,
                      transition: 'transform 0.15s, box-shadow 0.15s',
                    }}>
                      {/* Thumbnail */}
                      <div style={{ height: 112, position: 'relative', background: 'linear-gradient(135deg, #1e3a8a, #1e40af)', overflow: 'hidden' }}>
                        {(aula.capa_url || aula.youtube_video_id) && (
                          <img
                            src={aula.capa_url || `https://img.youtube.com/vi/${aula.youtube_video_id}/mqdefault.jpg`}
                            alt={aula.aula_titulo}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                          />
                        )}
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: '50%',
                            background: isConcluida ? '#22c55e' : isDisponivel ? '#3b82f6' : 'rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 16,
                          }}>
                            {isConcluida ? '✓' : isDisponivel ? '▶' : isBloqueada ? '🔒' : '⏳'}
                          </div>
                        </div>
                        {recertNeeded && (
                          <div style={{ position: 'absolute', top: 6, right: 6, background: '#f59e0b', borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 700, color: '#000' }}>
                            RECERT.
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div style={{ padding: '10px 12px' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, lineHeight: 1.35, color: 'var(--avp-text)' }}>{aula.aula_titulo}</p>

                        {/* Nota mínima + melhor pontuação */}
                        {(isConcluida || isDisponivel) && aula.quiz_aprovacao_minima != null && aula.quiz_aprovacao_minima > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <span style={{ fontSize: 10, color: 'var(--avp-text-dim)' }}>Mínimo: <strong style={{ color: isConcluida ? 'var(--avp-green)' : 'var(--avp-text)' }}>{aula.quiz_aprovacao_minima}%</strong></span>
                            {aula.melhor_percentual != null && (
                              <span style={{ fontSize: 10, color: 'var(--avp-text-dim)' }}>· Seu melhor: <strong style={{ color: aula.melhor_percentual >= (aula.quiz_aprovacao_minima ?? 0) ? 'var(--avp-green)' : '#f59e0b' }}>{aula.melhor_percentual}%</strong></span>
                            )}
                          </div>
                        )}

                        {isBloqueada && (
                          <p style={{ fontSize: 10, color: 'var(--avp-text-dim)', marginBottom: 6 }}>🔒 Complete a aula anterior para desbloquear</p>
                        )}

                        {aula.status === 'aguardando_tempo' && aula.liberada_em && (
                          <p style={{ fontSize: 10, color: '#f59e0b', marginBottom: 6 }}>⏳ Disponível em {new Date(aula.liberada_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: cor, fontWeight: 600 }}>
                            {isConcluida ? (recertNeeded ? '⚠️ Refazer' : '✓ Concluída') : isDisponivel ? '▶ Disponível' : aula.status === 'aguardando_tempo' ? '⏳ Aguardando' : '🔒 Bloqueada'}
                          </span>
                          {(isDisponivel || isConcluida) && (
                            <Link href={`/aluno/${params.whatsapp}/aula/${aula.aula_id}`}
                              style={{ fontSize: 12, background: isConcluida && !recertNeeded ? 'var(--avp-border)' : 'var(--avp-blue)', color: isConcluida && !recertNeeded ? 'var(--avp-text-dim)' : '#fff', textDecoration: 'none', fontWeight: 700, borderRadius: 6, padding: '3px 10px' }}>
                              {isConcluida && !recertNeeded ? 'Rever' : 'Acessar →'}
                            </Link>
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
            <div style={{ textAlign: 'center', padding: 80, color: 'var(--avp-text-dim)', background: 'var(--avp-card)', borderRadius: 16, border: '1px solid var(--avp-border)' }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>📚</p>
              <p style={{ fontSize: 16 }}>Nenhuma aula disponível no momento.</p>
              <p style={{ fontSize: 14, marginTop: 8 }}>Em breve novos conteúdos serão liberados!</p>
            </div>
          )}
        </div>
      </div>

      <RankingWidget meuId={aluno.id} />

      {aluno.status === 'concluido' && certMap['certificado_template_url'] && (
        <CertificadoWrapper
          nomeAluno={aluno.nome}
          templateUrl={certMap['certificado_template_url']}
          nomeX={Number(certMap['certificado_nome_x'] || 50)}
          nomeY={Number(certMap['certificado_nome_y'] || 62)}
          nomeTamanho={Number(certMap['certificado_nome_tamanho'] || 72)}
          nomeCor={certMap['certificado_nome_cor'] || '#1a1a2e'}
          cidade={certMap['certificado_cidade'] || ''}
          dataX={Number(certMap['certificado_data_x'] || 50)}
          dataY={Number(certMap['certificado_data_y'] || 72)}
          dataTamanho={Number(certMap['certificado_data_tamanho'] || 36)}
          dataCor={certMap['certificado_data_cor'] || '#1a1a2e'}
        />
      )}
    </>
  )
}
