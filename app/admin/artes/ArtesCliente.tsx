'use client'
import { useState } from 'react'

type Template = {
  id: string; tipo: string; titulo: string; arte_url: string;
  foto_x: number; foto_y: number; foto_largura: number; foto_altura: number;
  foto_redondo: boolean; ativo: boolean; formato: string;
}

export default function ArtesCliente({ inicial }: { inicial: Template[] }) {
  const [templates, setTemplates] = useState<Template[]>(inicial)
  const [aba, setAba] = useState<'feed' | 'stories'>('feed')
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')

  function atualizar(id: string, campo: keyof Template, valor: string | number | boolean) {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, [campo]: valor } : t))
  }

  async function salvar() {
    setSalvando(true); setMsg('')
    const res = await fetch('/api/admin/artes', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templates),
    })
    setSalvando(false)
    setMsg(res.ok ? 'Templates salvos!' : 'Erro ao salvar.')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)',
    borderRadius: 6, padding: '8px 10px', color: 'var(--avp-text)', fontSize: 13,
    outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', color: 'var(--avp-text-dim)', fontSize: 12, marginBottom: 4, fontWeight: 500,
  }

  const dims = aba === 'feed' ? '1080 × 1080 px (quadrado)' : '1080 × 1920 px (vertical)'
  const filtrados = templates.filter(t => t.formato === aba)

  return (
    <div>
      <div style={{ marginBottom: 20, padding: '14px 18px', background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, fontSize: 13, color: 'var(--avp-text-dim)' }}>
        <strong style={{ color: 'var(--avp-text)' }}>Como funciona:</strong> Crie as artes em PNG com fundo transparente ({dims}), hospede no Supabase Storage (bucket público) e cole a URL abaixo. Configure X/Y/Largura/Altura em porcentagem da dimensão da arte.
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['feed', 'stories'] as const).map(f => (
          <button
            key={f}
            onClick={() => setAba(f)}
            style={{
              background: aba === f ? 'var(--grad-brand)' : 'var(--avp-card)',
              border: `1px solid ${aba === f ? 'transparent' : 'var(--avp-border)'}`,
              borderRadius: 8, padding: '10px 24px', cursor: 'pointer',
              color: aba === f ? '#fff' : 'var(--avp-text-dim)',
              fontWeight: 700, fontSize: 14,
            }}
          >
            {f === 'feed' ? '🖼️ Feed (1080×1080)' : '📱 Stories (1080×1920)'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filtrados.map(t => (
          <div key={t.id} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20, opacity: t.ativo ? 1 : 0.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15 }}>
                  {t.titulo.replace(' (Stories)', '').replace(' (Feed)', '')}
                </p>
                <p style={{ fontSize: 11, color: 'var(--avp-text-dim)' }}>tipo: {t.tipo}</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox" checked={t.ativo}
                  onChange={e => atualizar(t.id, 'ativo', e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--avp-green)' }}
                />
                <span style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>Ativo</span>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>URL do PNG (fundo transparente) — {dims}</label>
                  <input
                    style={inputStyle}
                    value={t.arte_url}
                    onChange={e => atualizar(t.id, 'arte_url', e.target.value)}
                    placeholder="https://...supabase.co/storage/v1/object/public/artes/..."
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {(['foto_x', 'foto_y', 'foto_largura', 'foto_altura'] as const).map((campo, i) => (
                    <div key={campo}>
                      <label style={labelStyle}>{['Foto X (%)', 'Foto Y (%)', 'Largura (%)', 'Altura (%)'][i]}</label>
                      <input
                        type="number" min={0} max={100} style={inputStyle}
                        value={t[campo] as number}
                        onChange={e => atualizar(t.id, campo, Number(e.target.value))}
                      />
                    </div>
                  ))}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox" checked={t.foto_redondo}
                    onChange={e => atualizar(t.id, 'foto_redondo', e.target.checked)}
                    style={{ width: 15, height: 15, accentColor: 'var(--avp-green)' }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>Foto em formato circular</span>
                </label>
              </div>
              {t.arte_url && (
                <img
                  src={t.arte_url} alt={t.titulo}
                  style={{ width: aba === 'stories' ? 45 : 80, height: aba === 'stories' ? 80 : 80, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--avp-border)', flexShrink: 0 }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {msg && <p style={{ fontSize: 14, marginTop: 16, color: msg.includes('Erro') ? 'var(--avp-danger)' : 'var(--avp-green)' }}>{msg}</p>}
      <button
        onClick={salvar} disabled={salvando}
        style={{ marginTop: 20, background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontWeight: 700, fontSize: 15, cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1 }}
      >
        {salvando ? 'Salvando...' : 'Salvar todos os templates'}
      </button>
    </div>
  )
}
