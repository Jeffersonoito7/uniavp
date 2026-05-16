'use client'
import { useState } from 'react'

const LIMITE = 20

export default function IndicacaoCard({ link, totalIndicados }: { link: string; totalIndicados: number }) {
  const [copiado, setCopiado] = useState(false)
  const limiteBatido = totalIndicados >= LIMITE
  const pct = Math.min(100, Math.round((totalIndicados / LIMITE) * 100))

  function copiar() {
    navigator.clipboard.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  function compartilharWpp() {
    const msg = encodeURIComponent(`🎓 Conheça a plataforma onde estou me formando como consultor!\n\n👉 ${link}\n\nCadastre-se gratuitamente e comece sua jornada!`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <div style={{
      background: limiteBatido
        ? 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%)'
        : 'linear-gradient(135deg, rgba(2,161,83,0.08) 0%, rgba(5,150,105,0.05) 100%)',
      border: `1px solid ${limiteBatido ? 'rgba(99,102,241,0.3)' : 'rgba(2,161,83,0.25)'}`,
      borderRadius: 16,
      padding: '20px 24px',
      marginBottom: 28,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>
            🤝 Indique um amigo
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

      {/* Alerta de urgência a partir de 15 indicações */}
      {!limiteBatido && pct >= 75 && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'pulse 2s infinite',
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
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
            background: limiteBatido
              ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
              : pct >= 75
                ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                : 'linear-gradient(90deg, #059669, #02A153)',
            borderRadius: 100,
            transition: 'width 0.4s',
          }} />
        </div>
        <p style={{ fontSize: 11, color: pct >= 75 && !limiteBatido ? '#f87171' : 'var(--avp-text-dim)', marginTop: 4, fontWeight: pct >= 75 ? 700 : 400 }}>
          {limiteBatido
            ? 'Limite atingido — torne-se UNIAVP PRO para indicar mais'
            : `${LIMITE - totalIndicados} vagas restantes no plano gratuito`}
        </p>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.7} }`}</style>

      {limiteBatido ? (
        /* CTA de upgrade */
        <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: '18px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 22, marginBottom: 8 }}>🚀</p>
          <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>Você atingiu 20 indicações!</p>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
            No plano gratuito o limite é de <strong style={{ color: 'var(--avp-text)' }}>20 indicados</strong>.
            Torne-se <strong style={{ color: '#818cf8' }}>UNIAVP PRO</strong> para indicar sem limites e ter acesso ao painel de gestão completo.
          </p>
          <a href="/assinar-pro"
            style={{ display: 'inline-block', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: 10, padding: '12px 28px', fontWeight: 800, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
            ✨ Quero ser UNIAVP PRO
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
            <button onClick={copiar}
              style={{ flex: 1, minWidth: 120, background: copiado ? '#02A153' : 'linear-gradient(135deg, #059669, #02A153)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13, transition: 'background 0.2s' }}>
              {copiado ? '✓ Copiado!' : '📋 Copiar link'}
            </button>
            <button onClick={compartilharWpp}
              style={{ background: '#25d36620', border: '1px solid #25d36640', color: '#25d366', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              WhatsApp
            </button>
          </div>
        </>
      )}
    </div>
  )
}
