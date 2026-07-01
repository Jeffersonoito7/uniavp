'use client'
import { useState } from 'react'

const LIMITE = 20

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 60) return min <= 1 ? 'agora' : `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return h === 1 ? 'há 1h' : `há ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return d === 1 ? 'há 1 dia' : `há ${d} dias`
  const s = Math.floor(d / 7)
  return s === 1 ? 'há 1 sem' : `há ${s} sem`
}

export default function IndicacaoCard({
  link,
  totalIndicados,
  ultimosIndicados = [],
  bloqueado = false,
}: {
  link: string
  totalIndicados: number
  ultimosIndicados?: { nome: string; criado_em: string }[]
  bloqueado?: boolean
}) {
  const [copiado, setCopiado] = useState(false)
  const limiteBatido = totalIndicados >= LIMITE
  const pct = Math.min(100, Math.round((totalIndicados / LIMITE) * 100))

  function copiar() {
    navigator.clipboard.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  function compartilharWpp() {
    const msg = encodeURIComponent(`Conheça a plataforma onde me formo como consultor!\n\n${link}\n\nCadastro gratuito.`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  if (bloqueado) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Conteúdo desfocado por baixo */}
        <div style={{ filter: 'blur(3px)', opacity: 0.3, pointerEvents: 'none', userSelect: 'none' }}>
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Indique um amigo</p>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 16 }}>Compartilhe seu link e traga outros consultores gratuitamente</p>
          <div style={{ background: 'var(--avp-black)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, border: '1px solid var(--avp-border)' }}>
            <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#22c55e' }}>{link}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, height: 36, background: 'var(--avp-green)', borderRadius: 8 }} />
            <div style={{ width: 90, height: 36, background: 'rgba(37,211,102,0.1)', borderRadius: 8 }} />
          </div>
        </div>
        {/* Overlay de bloqueio */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(10,10,15,0.55)',
          backdropFilter: 'blur(2px)',
          borderRadius: 16,
          padding: '20px 24px',
          textAlign: 'center',
          gap: 8,
        }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <p style={{ fontWeight: 800, fontSize: 15, color: '#fff', margin: 0 }}>Conclua o 1° módulo para indicar</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
            Ao concluir o primeiro módulo, seu link de indicação é liberado.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: limiteBatido ? 'rgba(79,70,229,0.06)' : 'rgba(34,197,94,0.06)',
      border: `1px solid ${limiteBatido ? 'rgba(79,70,229,0.25)' : 'rgba(34,197,94,0.2)'}`,
      borderRadius: 16,
      padding: '20px 24px',
      marginBottom: 28,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
            Indique um amigo
          </p>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
            Compartilhe seu link e traga outros consultores gratuitamente
          </p>
        </div>
        {/* Badge de uso */}
        <div style={{
          background: limiteBatido ? 'rgba(99,102,241,0.15)' : 'rgba(2,161,83,0.15)',
          border: `1px solid ${limiteBatido ? 'rgba(99,102,241,0.3)' : 'rgba(2,161,83,0.3)'}`,
          borderRadius: 12,
          padding: '8px 16px',
          textAlign: 'center',
          flexShrink: 0,
          minWidth: 72,
        }}>
          <p style={{ fontSize: 20, fontWeight: 900, color: limiteBatido ? '#818cf8' : '#22c55e', margin: 0, lineHeight: 1 }}>
            {totalIndicados}<span style={{ fontSize: 13, fontWeight: 600, color: 'var(--avp-text-dim)' }}>/{LIMITE}</span>
          </p>
          <p style={{ fontSize: 10, color: 'var(--avp-text-dim)', margin: '2px 0 0', fontWeight: 600, textTransform: 'uppercase' }}>
            indicados
          </p>
        </div>
      </div>

      {/* Lista dos últimos que se cadastraram */}
      {ultimosIndicados.length > 0 && (
        <div style={{
          background: 'rgba(34,197,94,0.05)',
          border: '1px solid rgba(34,197,94,0.15)',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 14,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Via seu link
          </p>
          {ultimosIndicados.map((ind, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < ultimosIndicados.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
                {ind.nome} <span style={{ fontWeight: 400, color: 'var(--avp-text-dim)' }}>se cadastrou</span>
              </p>
              <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: 0, flexShrink: 0, marginLeft: 8 }}>
                {tempoRelativo(ind.criado_em)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Alerta de urgência a partir de 15 indicações */}
      {!limiteBatido && pct >= 75 && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0, color: '#f87171' }}>!</span>
          <div>
            <p style={{ fontWeight: 800, fontSize: 13, color: '#f87171', margin: 0 }}>
              Apenas {LIMITE - totalIndicados} {LIMITE - totalIndicados === 1 ? 'vaga restante' : 'vagas restantes'}!
            </p>
            <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '2px 0 0', lineHeight: 1.4 }}>
              Ao atingir 20, suas próximas indicações serão bloqueadas. Faça upgrade para indicar sem limites.
            </p>
          </div>
        </div>
      )}

      {/* Barra de progresso do limite */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ background: 'var(--avp-border)', borderRadius: 100, height: 8, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`,
            height: '100%',
            background: limiteBatido ? '#4f46e5' : pct >= 75 ? '#f59e0b' : '#22c55e',
            borderRadius: 100,
            transition: 'width 0.4s',
          }} />
        </div>
        <p style={{ fontSize: 11, color: pct >= 75 && !limiteBatido ? '#f87171' : 'var(--avp-text-dim)', marginTop: 4, fontWeight: pct >= 75 ? 700 : 400 }}>
          {limiteBatido
            ? 'Limite atingido. Torne-se UNIAVP PRO para indicar mais.'
            : `${LIMITE - totalIndicados} vagas restantes no plano gratuito`}
        </p>
      </div>

      {limiteBatido ? (
        /* CTA de upgrade */
        <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: '18px 20px', textAlign: 'center' }}>
          <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>Limite atingido: 20 indicações</p>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
            Com o <strong style={{ color: '#818cf8' }}>UNIAVP PRO</strong> você indica sem limites e acessa o painel de gestão.
          </p>
          <a href="/assinar-pro" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Quero ser UNIAVP PRO
          </a>
        </div>
      ) : (
        <>
          {/* Link */}
          <div style={{ background: 'var(--avp-black)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--avp-border)' }}>
            <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#22c55e', flex: 1, wordBreak: 'break-all' }}>{link}</span>
          </div>
          {/* Botões */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={copiar} className="btn btn-green btn-sm" style={{ flex: 1, minWidth: 120 }}>
              {copiado ? 'Copiado!' : 'Copiar link'}
            </button>
            <button onClick={compartilharWpp} className="btn btn-sm" style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: '#25d366' }}>
              WhatsApp
            </button>
          </div>
        </>
      )}
    </div>
  )
}
