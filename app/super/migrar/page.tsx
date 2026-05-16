'use client'
import { useEffect, useState } from 'react'

type Migration = { id: string; descricao: string; sql: string; aplicada: boolean }

export default function MigrarPage() {
  const [migrations, setMigrations] = useState<Migration[]>([])
  const [copiado, setCopiado] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/super/migrar').then(r => r.json()).then(d => {
      setMigrations(d.migrations ?? [])
      setLoading(false)
    })
  }, [])

  function copiar(sql: string, id: string) {
    navigator.clipboard.writeText(sql)
    setCopiado(id)
    setTimeout(() => setCopiado(null), 3000)
  }

  const pendentes = migrations.filter(m => !m.aplicada)
  const aplicadas = migrations.filter(m => m.aplicada)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f0f1f5', fontFamily: 'Inter, sans-serif', padding: '40px 24px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>🗄 Migrations do Banco</h1>
          <p style={{ color: '#8a8fa3', fontSize: 14 }}>
            Copie o SQL e cole no{' '}
            <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer"
              style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}>
              Supabase → SQL Editor ↗
            </a>
          </p>
        </div>

        {loading && (
          <p style={{ color: '#8a8fa3', textAlign: 'center', padding: 40 }}>Verificando banco...</p>
        )}

        {/* Pendentes */}
        {pendentes.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
              ⚠️ {pendentes.length} pendente{pendentes.length > 1 ? 's' : ''}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pendentes.map(m => (
                <div key={m.id} style={{ background: '#181b24', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{m.id}</p>
                      <p style={{ color: '#8a8fa3', fontSize: 13, margin: '3px 0 0' }}>{m.descricao}</p>
                    </div>
                    <button onClick={() => copiar(m.sql, m.id)}
                      style={{ background: copiado === m.id ? '#22c55e' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}>
                      {copiado === m.id ? '✓ Copiado!' : '📋 Copiar SQL'}
                    </button>
                  </div>
                  <pre style={{ margin: 0, padding: '16px 20px', fontSize: 12, color: '#a5b4fc', lineHeight: 1.7, overflowX: 'auto', background: 'rgba(99,102,241,0.05)' }}>
                    {m.sql}
                  </pre>
                  <div style={{ padding: '12px 20px', background: 'rgba(248,113,113,0.05)', borderTop: '1px solid rgba(248,113,113,0.15)', fontSize: 12, color: '#8a8fa3' }}>
                    1. Copie o SQL acima → 2. Abra o{' '}
                    <a href="https://supabase.com/dashboard/project/_/sql/new" target="_blank" rel="noreferrer" style={{ color: '#818cf8' }}>Supabase SQL Editor</a>
                    {' '}→ 3. Cole e clique em <strong style={{ color: '#f0f1f5' }}>Run</strong> → 4. Volte aqui para confirmar
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aplicadas */}
        {aplicadas.length > 0 && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
              ✅ {aplicadas.length} já aplicada{aplicadas.length > 1 ? 's' : ''}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {aplicadas.map(m => (
                <div key={m.id} style={{ background: '#181b24', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#22c55e', fontSize: 18 }}>✅</span>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>{m.id}</p>
                    <p style={{ color: '#8a8fa3', fontSize: 12, margin: '2px 0 0' }}>{m.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && migrations.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#8a8fa3' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>✅</p>
            <p style={{ fontWeight: 700, fontSize: 16 }}>Nenhuma migration pendente</p>
          </div>
        )}

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <a href="/super" style={{ color: '#8a8fa3', fontSize: 13, textDecoration: 'none' }}>← Voltar ao Super Admin</a>
        </div>
      </div>
    </div>
  )
}
