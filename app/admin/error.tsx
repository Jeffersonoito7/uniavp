'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('ADMIN ERROR:', error)
  }, [error])

  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      minHeight: 400,
    }}>
      <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <AlertTriangle size={24} style={{ color: '#ef4444' }} />
        </div>

        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: 'var(--avp-text)' }}>
          Erro ao carregar a pagina
        </h2>
        <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginBottom: 24, lineHeight: 1.6 }}>
          Nao foi possivel carregar o conteudo. Verifique sua conexao e tente novamente.
        </p>

        {isDev && (
          <div style={{
            background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 20,
            textAlign: 'left',
            fontFamily: 'monospace',
            fontSize: 11,
            color: '#fca5a5',
            wordBreak: 'break-all',
            lineHeight: 1.5,
          }}>
            {error?.name}: {error?.message}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--avp-blue)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '9px 20px',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} />
            Tentar novamente
          </button>
          <a
            href="/admin"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--avp-card)',
              color: 'var(--avp-text)',
              border: '1px solid var(--avp-border)',
              borderRadius: 8,
              padding: '9px 20px',
              fontWeight: 600,
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            <LayoutDashboard size={13} />
            Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
