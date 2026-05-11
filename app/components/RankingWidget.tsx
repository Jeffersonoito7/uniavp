'use client'
import { useState, useEffect } from 'react'

type Entrada = { id: string; nome: string; pontos: number }

const medalhas = ['🥇', '🥈', '🥉']
const cores = ['#f59e0b', '#94a3b8', '#d97706']

export default function RankingWidget({ meuId }: { meuId: string }) {
  const [aberto, setAberto] = useState(false)
  const [top, setTop] = useState<Entrada[]>([])
  const [carregado, setCarregado] = useState(false)

  useEffect(() => {
    fetch('/api/ranking')
      .then(r => r.json())
      .then(d => { setTop(d.top ?? []); setCarregado(true) })
      .catch(() => setCarregado(true))
  }, [])

  if (!carregado || top.length === 0) return null

  const minhaPosicao = top.findIndex(t => t.id === meuId)
  const top3 = top.slice(0, 3)

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setAberto(a => !a)}
        title="Ranking da equipe"
        style={{
          position: 'fixed', bottom: 88, right: 20, zIndex: 900,
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          border: 'none', cursor: 'pointer', fontSize: 22,
          boxShadow: '0 4px 20px rgba(245,158,11,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        🏆
      </button>

      {/* Painel do ranking */}
      {aberto && (
        <>
          {/* Overlay mobile */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 950 }}
            onClick={() => setAberto(false)}
          />
          <div style={{
            position: 'fixed', bottom: 152, right: 20, zIndex: 960,
            width: 300, background: 'var(--avp-card)',
            border: '1px solid var(--avp-border)', borderRadius: 16,
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #d97706, #f59e0b)',
              padding: '16px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <p style={{ fontWeight: 800, fontSize: 15, color: '#fff', margin: 0 }}>🏆 Ranking da Equipe</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: '2px 0 0' }}>Top consultores por pontos</p>
              </div>
              <button onClick={() => setAberto(false)}
                style={{ background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 16, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ×
              </button>
            </div>

            {/* Pódio top 3 */}
            <div style={{ padding: '16px 16px 8px', display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'flex-end' }}>
              {/* 2º lugar */}
              {top3[1] && (
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#94a3b820', border: '2px solid #94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, margin: '0 auto 4px', color: '#94a3b8' }}>
                    {top3[1].nome.charAt(0).toUpperCase()}
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 700, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 72, color: 'var(--avp-text)' }}>
                    {top3[1].nome.split(' ')[0]}
                  </p>
                  <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{top3[1].pontos} pts</p>
                  <div style={{ background: '#94a3b830', borderRadius: '6px 6px 0 0', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 6, fontSize: 20 }}>🥈</div>
                </div>
              )}
              {/* 1º lugar */}
              {top3[0] && (
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f59e0b20', border: '3px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, margin: '0 auto 4px', color: '#f59e0b' }}>
                    {top3[0].nome.charAt(0).toUpperCase()}
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 800, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80, color: 'var(--avp-text)' }}>
                    {top3[0].nome.split(' ')[0]}
                  </p>
                  <p style={{ fontSize: 11, color: '#f59e0b', margin: 0, fontWeight: 600 }}>{top3[0].pontos} pts</p>
                  <div style={{ background: '#f59e0b30', borderRadius: '6px 6px 0 0', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 6, fontSize: 24 }}>🥇</div>
                </div>
              )}
              {/* 3º lugar */}
              {top3[2] && (
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#d9770620', border: '2px solid #d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, margin: '0 auto 4px', color: '#d97706' }}>
                    {top3[2].nome.charAt(0).toUpperCase()}
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 700, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 72, color: 'var(--avp-text)' }}>
                    {top3[2].nome.split(' ')[0]}
                  </p>
                  <p style={{ fontSize: 10, color: '#d97706', margin: 0 }}>{top3[2].pontos} pts</p>
                  <div style={{ background: '#d9770630', borderRadius: '6px 6px 0 0', height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 6, fontSize: 18 }}>🥉</div>
                </div>
              )}
            </div>

            {/* Lista completa top 10 */}
            <div style={{ padding: '8px 16px 16px', maxHeight: 200, overflowY: 'auto' }}>
              {top.map((c, i) => {
                const eu = c.id === meuId
                const medalha = medalhas[i]
                return (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 8, marginBottom: 4,
                    background: eu ? 'rgba(59,130,246,0.15)' : i < 3 ? `${cores[i]}10` : 'transparent',
                    border: eu ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                  }}>
                    <span style={{ fontSize: medalha ? 16 : 13, fontWeight: 700, width: 24, textAlign: 'center', color: i < 3 ? cores[i] : 'var(--avp-text-dim)', flexShrink: 0 }}>
                      {medalha ?? `${i + 1}º`}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: eu ? 700 : 500, color: eu ? '#60a5fa' : 'var(--avp-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.nome.split(' ')[0]}{eu ? ' (você)' : ''}
                    </span>
                    <span style={{ fontSize: 12, color: i < 3 ? cores[i] : 'var(--avp-text-dim)', fontWeight: 600, flexShrink: 0 }}>
                      {c.pontos} pts
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Posição do usuário se não estiver no top 10 */}
            {minhaPosicao === -1 && (
              <div style={{ padding: '0 16px 16px' }}>
                <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: '#60a5fa', margin: 0 }}>Complete aulas para entrar no ranking! 🚀</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
