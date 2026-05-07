'use client'
import { useState } from 'react'

type Template = {
  id: string; tipo: string; titulo: string; arte_url: string;
  foto_x: number; foto_y: number; foto_largura: number; foto_altura: number;
  foto_redondo: boolean; ativo: boolean;
}

export default function ArtesCliente({ inicial }: { inicial: Template[] }) {
  const [templates, setTemplates] = useState<Template[]>(inicial)
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
    borderRadius: 6, padding: '8px 10px', color: 'var(--avp-text)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 12, marginBottom: 4, fontWeight: 500 }

  return (
    <div>
      <div style={{ marginBottom: 20, padding: '14px 18px', background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, fontSize: 13, color: 'var(--avp-text-dim)' }}>
        <strong style={{ color: 'var(--avp-text)' }}>Como funciona:</strong> Crie suas artes em PNG com fundo transparente (1080×1080px recomendado).
        Hospede no Supabase Storage (bucket público) e cole a URL aqui. Configure onde a foto do consultor será posicionada (% da largura/altura da arte).
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {templates.map(t => (
          <div key={t.id} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20, opacity: t.ativo ? 1 : 0.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15 }}>{t.titulo}</p>
                <p style={{ fontSize: 11, color: 'var(--avp-text-dim)' }}>tipo: {t.tipo}</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={t.ativo} onChange={e => atualizar(t.id, 'ativo', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--avp-green)' }} />
                <span style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>Ativo</span>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>URL do PNG da arte (fundo transparente)</label>
                  <input style={inputStyle} value={t.arte_url} onChange={e => atualizar(t.id, 'arte_url', e.target.value)} placeholder="https://...supabase.co/storage/v1/object/public/artes/boas_vindas.png" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Foto X (%)</label>
                    <input type="number" min={0} max={100} style={inputStyle} value={t.foto_x} onChange={e => atualizar(t.id, 'foto_x', Number(e.target.value))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Foto Y (%)</label>
                    <input type="number" min={0} max={100} style={inputStyle} value={t.foto_y} onChange={e => atualizar(t.id, 'foto_y', Number(e.target.value))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Largura (%)</label>
                    <input type="number" min={1} max={100} style={inputStyle} value={t.foto_largura} onChange={e => atualizar(t.id, 'foto_largura', Number(e.target.value))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Altura (%)</label>
                    <input type="number" min={1} max={100} style={inputStyle} value={t.foto_altura} onChange={e => atualizar(t.id, 'foto_altura', Number(e.target.value))} />
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={t.foto_redondo} onChange={e => atualizar(t.id, 'foto_redondo', e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--avp-green)' }} />
                  <span style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>Foto em formato circular</span>
                </label>
              </div>
              {t.arte_url && (
                <img src={t.arte_url} alt={t.titulo} style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--avp-border)', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              )}
            </div>
          </div>
        ))}
      </div>

      {msg && <p style={{ fontSize: 14, marginTop: 16, color: msg.includes('Erro') ? 'var(--avp-danger)' : 'var(--avp-green)' }}>{msg}</p>}
      <button onClick={salvar} disabled={salvando} style={{ marginTop: 20, background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontWeight: 700, fontSize: 15, cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1 }}>
        {salvando ? 'Salvando...' : 'Salvar todos os templates'}
      </button>
    </div>
  )
}
