'use client'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('APP ERROR:', error)
  }, [error])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f1f5f9', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 600, width: '100%' }}>
        <p style={{ fontSize: 40, marginBottom: 16 }}>⚠️</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, color: '#f87171' }}>Erro de aplicação</h1>

        {/* Mostra o erro real */}
        <div style={{ background: '#1a0a0a', border: '1px solid #7f1d1d', borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontFamily: 'monospace', fontSize: 13, color: '#fca5a5', wordBreak: 'break-all', lineHeight: 1.6 }}>
          <strong>{error?.name}:</strong> {error?.message}
          {error?.stack && (
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: 'pointer', color: '#f87171', fontSize: 12 }}>Stack trace</summary>
              <pre style={{ marginTop: 8, fontSize: 11, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>{error.stack}</pre>
            </details>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={reset}
            style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            Tentar novamente
          </button>
          <a href="/" style={{ background: 'rgba(255,255,255,0.08)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  )
}
