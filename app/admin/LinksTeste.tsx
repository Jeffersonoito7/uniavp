'use client'
import { useState } from 'react'

const paineis = [
  {
    label: 'Painel Admin',
    desc: 'Painel da empresa (você está aqui)',
    href: '/admin',
    icon: '🛡',
    cor: '#333687',
    email: null,
    senha: null,
  },
  {
    label: 'UNIAVP PRO',
    desc: 'Como o PRO vê a plataforma',
    href: '/pro',
    icon: '👤',
    cor: '#02A153',
    email: 'carlos.gestor@uniavp.demo',
    senha: 'Demo@2025',
  },
  {
    label: 'UNIAVP FREE',
    desc: 'Como o FREE vê a plataforma',
    href: '/free/85999990002',
    icon: '🎓',
    cor: '#f59e0b',
    email: 'ana.consultora@uniavp.demo',
    senha: 'Demo@2025',
  },
  {
    label: 'Login unificado',
    desc: 'Página de entrada da plataforma',
    href: '/entrar',
    icon: '🔐',
    cor: '#8a8fa3',
    email: null,
    senha: null,
  },
  {
    label: 'Cadastro FREE',
    desc: 'Página que o consultor usa para se cadastrar',
    href: '/captacao',
    icon: '📋',
    cor: '#8a8fa3',
    email: null,
    senha: null,
  },
  {
    label: 'Cadastro Gestor',
    desc: 'Página que o gestor usa para se cadastrar',
    href: '/convite/gestor',
    icon: '📝',
    cor: '#8a8fa3',
    email: null,
    senha: null,
  },
]

export default function LinksTeste() {
  const [aberto, setAberto] = useState(false)
  const [copiado, setCopiado] = useState<string | null>(null)

  function copiar(texto: string, key: string) {
    navigator.clipboard.writeText(texto)
    setCopiado(key)
    setTimeout(() => setCopiado(null), 2000)
  }

  function urlCompleta(href: string) {
    return typeof window !== 'undefined' ? `${window.location.origin}${href}` : href
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <button
        onClick={() => setAberto(a => !a)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', color: 'var(--avp-text)', fontSize: 14, fontWeight: 600, width: '100%', justifyContent: 'space-between' }}>
        <span>🔗 Links de Teste dos Painéis</span>
        <span style={{ color: 'var(--avp-text-dim)', fontSize: 12 }}>{aberto ? '▲ Fechar' : '▼ Abrir'}</span>
      </button>

      {aberto && (
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {paineis.map(p => (
            <div key={p.href} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{p.icon}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--avp-text)', margin: 0 }}>{p.label}</p>
                  <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0 }}>{p.desc}</p>
                </div>
              </div>

              {p.email && (
                <div style={{ background: 'var(--avp-black)', borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--avp-text-dim)', fontFamily: 'monospace' }}>{p.email}</span>
                    <button onClick={() => copiar(p.email!, `email-${p.href}`)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiado === `email-${p.href}` ? 'var(--avp-green)' : 'var(--avp-text-dim)', fontSize: 11, padding: 0, fontWeight: 600 }}>
                      {copiado === `email-${p.href}` ? '✓' : 'copiar'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--avp-text-dim)', fontFamily: 'monospace' }}>{p.senha}</span>
                    <button onClick={() => copiar(p.senha!, `senha-${p.href}`)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiado === `senha-${p.href}` ? 'var(--avp-green)' : 'var(--avp-text-dim)', fontSize: 11, padding: 0, fontWeight: 600 }}>
                      {copiado === `senha-${p.href}` ? '✓' : 'copiar'}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => copiar(urlCompleta(p.href), `link-${p.href}`)}
                  style={{ flex: 1, background: 'var(--avp-black)', border: '1px solid var(--avp-border)', color: copiado === `link-${p.href}` ? 'var(--avp-green)' : 'var(--avp-text-dim)', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.15s' }}>
                  {copiado === `link-${p.href}` ? '✓ Copiado!' : '📋 Copiar link'}
                </button>
                <a href={p.href} target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: p.cor, color: '#fff', borderRadius: 8, padding: '8px 10px', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>
                  Abrir ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
