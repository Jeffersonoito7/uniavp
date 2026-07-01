'use client'
import { useState } from 'react'
import { Link2 } from 'lucide-react'

export default function LinkParceiroPopup() {
  const [link, setLink] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [concluido, setConcluido] = useState(false)

  const linkValido = link.trim().startsWith('http://') || link.trim().startsWith('https://')

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!linkValido) {
      setErro('Informe um link valido (começa com https://).')
      return
    }
    setSalvando(true)
    try {
      const res = await fetch('/api/gestor/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link_externo: link.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao salvar.')
        setSalvando(false)
        return
      }
      setConcluido(true)
      setTimeout(() => window.location.reload(), 1200)
    } catch {
      setErro('Erro de conexao. Tente novamente.')
      setSalvando(false)
    }
  }

  if (concluido) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.80)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#0f0f1a',
        border: '1px solid rgba(99,102,241,0.4)',
        borderRadius: 16,
        padding: '36px 32px',
        maxWidth: 440,
        width: '100%',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.3)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
          }}>
            <Link2 size={26} color="#818cf8" />
          </div>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
            Link da plataforma parceira
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
            Informe o link de cadastro da sua plataforma parceira. Ele sera exibido automaticamente para os membros que vierem pelo seu link de captacao.
          </p>
        </div>

        <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Link da plataforma
              {link.length > 5 && (
                <span style={{ marginLeft: 8, color: linkValido ? '#4ade80' : '#f87171', textTransform: 'none', fontWeight: 800 }}>
                  {linkValido ? 'valido' : 'invalido'}
                </span>
              )}
            </label>
            <input
              type="url"
              placeholder="https://plataforma.com/cadastro/seu-link"
              value={link}
              onChange={e => setLink(e.target.value)}
              required
              autoFocus
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${link.length > 5 && !linkValido ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 10,
                padding: '13px 16px',
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {erro && (
            <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{erro}</p>
          )}

          <button
            type="submit"
            disabled={salvando || !linkValido}
            style={{
              background: linkValido ? '#6366f1' : 'rgba(255,255,255,0.08)',
              color: linkValido ? '#fff' : 'rgba(255,255,255,0.3)',
              border: 'none',
              borderRadius: 10,
              padding: '14px',
              fontWeight: 800,
              fontSize: 15,
              cursor: salvando || !linkValido ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              marginTop: 4,
            }}
          >
            {salvando ? 'Salvando...' : concluido ? 'Salvo!' : 'Salvar e continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}
