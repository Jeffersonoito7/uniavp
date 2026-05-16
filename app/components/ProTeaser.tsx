'use client'
import { useState } from 'react'

const MULTIPLICADORES = [3, 5, 10]

function FakeRow({ nome, prog, dias }: { nome: string; prog: number; dias: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
        {nome[0]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nome}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 100, height: 4 }}>
            <div style={{ width: `${prog}%`, height: '100%', background: prog === 100 ? '#22c55e' : 'linear-gradient(90deg,#3b82f6,#6366f1)', borderRadius: 100 }} />
          </div>
          <span style={{ fontSize: 10, color: 'var(--avp-text-dim)', flexShrink: 0 }}>{prog}%</span>
        </div>
      </div>
      <span style={{ fontSize: 10, color: dias > 7 ? '#f87171' : 'var(--avp-text-dim)', flexShrink: 0, fontWeight: dias > 7 ? 700 : 400 }}>
        {dias}d
      </span>
    </div>
  )
}

export default function ProTeaser({ totalIndicados }: { totalIndicados: number }) {
  const [mult, setMult] = useState(3)
  const nivel1 = totalIndicados
  const nivel2 = totalIndicados * mult
  const nivel3 = totalIndicados * mult * mult
  const total = nivel1 + nivel2 + nivel3

  const fakeEquipe = [
    { nome: 'Ana Souza', prog: 78, dias: 1 },
    { nome: 'Carlos Lima', prog: 45, dias: 3 },
    { nome: 'Maria Oliveira', prog: 100, dias: 8 },
    { nome: 'João Santos', prog: 12, dias: 14 },
    { nome: 'Paula Costa', prog: 60, dias: 2 },
  ]

  return (
    <div style={{ marginBottom: 28, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(99,102,241,0.3)', background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))' }}>

      {/* Header */}
      <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <div>
            <p style={{ fontWeight: 800, fontSize: 15, margin: 0 }}>Veja o painel PRO que aguarda você</p>
            <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>
              Desbloqueie gestão completa da sua equipe
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,0.8fr)', gap: 0 }}>

        {/* Preview desfocado do painel PRO */}
        <div style={{ padding: '16px 20px', borderRight: '1px solid rgba(99,102,241,0.15)', position: 'relative' }}>
          <div style={{ filter: 'blur(3.5px)', userSelect: 'none', pointerEvents: 'none' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--avp-text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Sua equipe FREE
            </p>
            {fakeEquipe.map(f => <FakeRow key={f.nome} {...f} />)}
          </div>

          {/* Overlay de cadeado */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 6,
            background: 'rgba(10,10,20,0.45)',
          }}>
            <div style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              🔒
            </div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#a5b4fc', textAlign: 'center', margin: 0 }}>
              Disponível no PRO
            </p>
          </div>
        </div>

        {/* Calculadora */}
        <div style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            📊 Calculadora de equipe
          </p>

          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '0 0 6px' }}>Se cada indicado trouxer:</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {MULTIPLICADORES.map(m => (
                <button key={m} onClick={() => setMult(m)}
                  style={{ flex: 1, background: mult === m ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)', border: `1px solid ${mult === m ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, padding: '6px 0', color: mult === m ? '#a5b4fc' : 'var(--avp-text-dim)', fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>Você indicou</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--avp-text)' }}>{nivel1}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>Eles trazem</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#60a5fa' }}>{nivel2}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>3ª geração</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#a78bfa' }}>{nivel3}</span>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--avp-text)' }}>Total potencial</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#818cf8' }}>{total}</span>
            </div>
          </div>

          <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', lineHeight: 1.5, margin: '0 0 14px' }}>
            Com PRO você acompanha cada um em tempo real.
          </p>

          <a href="/upgrade"
            style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: 10, padding: '10px 12px', fontWeight: 800, fontSize: 13, textDecoration: 'none', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
            ✨ Quero ser PRO
          </a>
        </div>
      </div>
    </div>
  )
}
