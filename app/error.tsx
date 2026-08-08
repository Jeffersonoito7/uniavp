'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('APP ERROR:', error)
  }, [error])

  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--avp-black, #08090d)',
      color: 'var(--avp-text, #f0f1f5)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(239,68,68,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <AlertTriangle size={28} style={{ color: '#ef4444' }} />
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, color: 'var(--avp-text, #f0f1f5)' }}>
          Algo deu errado
        </h1>
        <p style={{ fontSize: 14, color: 'var(--avp-text-dim, #8892a4)', marginBottom: 28, lineHeight: 1.6 }}>
          Ocorreu um erro inesperado. Tente novamente ou volte ao inicio.
        </p>

        {isDev && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 24,
            textAlign: 'left',
            fontFamily: 'monospace',
            fontSize: 12,
            color: '#fca5a5',
            wordBreak: 'break-all',
            lineHeight: 1.6,
          }}>
            <strong>{error?.name}:</strong> {error?.message}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--avp-blue, #333687)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 22px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} />
            Tentar novamente
          </button>
          <a
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,255,255,0.07)',
              color: 'var(--avp-text, #f0f1f5)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              padding: '10px 22px',
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            <Home size={14} />
            Inicio
          </a>
        </div>
      </div>
    </div>
  )
}
