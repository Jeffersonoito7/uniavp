'use client'
import { useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Template = {
  id: string; tipo: string; titulo: string; arte_url: string;
  foto_x: number; foto_y: number; foto_largura: number; foto_altura: number;
  foto_redondo: boolean; ativo: boolean; formato: string;
}

function supabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default function ArtesCliente({ inicial }: { inicial: Template[] }) {
  const [templates, setTemplates] = useState<Template[]>(inicial)
  const [aba, setAba] = useState<'feed' | 'stories'>('feed')
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')
  const [uploading, setUploading] = useState<string | null>(null)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  function atualizar(id: string, campo: keyof Template, valor: string | number | boolean) {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, [campo]: valor } : t))
  }

  async function uploadArte(templateId: string, file: File) {
    setUploading(templateId)
    setMsg('')
    const ext = file.name.split('.').pop() || 'png'
    const path = `artes/${templateId}-${Date.now()}.${ext}`

    const sb = supabase()
    const { error } = await sb.storage.from('artes').upload(path, file, { upsert: true, contentType: file.type })

    if (error) {
      setMsg(`Erro no upload: ${error.message}. Verifique se o bucket "artes" existe e é público.`)
      setUploading(null)
      return
    }

    const { data: { publicUrl } } = sb.storage.from('artes').getPublicUrl(path)
    atualizar(templateId, 'arte_url', publicUrl)
    setMsg('Arte enviada com sucesso! Clique em Salvar para confirmar.')
    setUploading(null)
  }

  async function salvar() {
    setSalvando(true); setMsg('')
    const res = await fetch('/api/admin/artes', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templates),
    })
    setSalvando(false)
    setMsg(res.ok ? 'Templates salvos com sucesso!' : 'Erro ao salvar.')
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
        <strong style={{ color: 'var(--avp-text)' }}>Como funciona:</strong> Faça upload do PNG com fundo transparente ({dims}) usando o botão <strong style={{ color: 'var(--avp-text)' }}>📤 Subir Arte</strong> — a URL é preenchida automaticamente. Configure X/Y/Largura/Altura (% da dimensão da arte) para posicionar a foto do consultor. Clique em <strong style={{ color: 'var(--avp-text)' }}>Salvar</strong> no final.
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

                {/* Upload + URL */}
                <div>
                  <label style={labelStyle}>Arte PNG (fundo transparente) — {dims}</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      value={t.arte_url}
                      onChange={e => atualizar(t.id, 'arte_url', e.target.value)}
                      placeholder="Cole a URL ou use o botão para fazer upload"
                    />
                    <input
                      type="file"
                      accept="image/png,image/webp,image/jpeg"
                      style={{ display: 'none' }}
                      ref={el => { inputRefs.current[t.id] = el }}
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) uploadArte(t.id, file)
                        e.target.value = ''
                      }}
                    />
                    <button
                      onClick={() => inputRefs.current[t.id]?.click()}
                      disabled={uploading === t.id}
                      title="Subir PNG da arte"
                      style={{
                        background: uploading === t.id ? 'var(--avp-border)' : 'var(--avp-blue)',
                        color: '#fff', border: 'none', borderRadius: 6,
                        padding: '0 14px', cursor: uploading === t.id ? 'not-allowed' : 'pointer',
                        fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0,
                      }}
                    >
                      {uploading === t.id ? '⏳ Enviando...' : '📤 Subir Arte'}
                    </button>
                  </div>
                </div>

                {/* Posição da foto */}
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

              {/* Preview miniatura */}
              {t.arte_url ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <img
                    src={t.arte_url} alt={t.titulo}
                    style={{
                      width: aba === 'stories' ? 45 : 72,
                      height: aba === 'stories' ? 80 : 72,
                      objectFit: 'contain', borderRadius: 6,
                      border: '1px solid var(--avp-border)', flexShrink: 0,
                    }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <button
                    onClick={() => inputRefs.current[t.id]?.click()}
                    disabled={uploading === t.id}
                    style={{ background: 'none', border: '1px solid var(--avp-border)', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: 'var(--avp-text-dim)', cursor: 'pointer' }}
                  >
                    Trocar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => inputRefs.current[t.id]?.click()}
                  style={{
                    width: 72, height: 72, background: 'var(--avp-black)',
                    border: '2px dashed var(--avp-border)', borderRadius: 8,
                    cursor: 'pointer', color: 'var(--avp-text-dim)', fontSize: 24,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                  title="Subir arte"
                >
                  +
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {msg && (
        <p style={{ fontSize: 14, marginTop: 16, color: msg.includes('Erro') ? 'var(--avp-danger)' : 'var(--avp-green)' }}>
          {msg}
        </p>
      )}

      <button
        onClick={salvar} disabled={salvando}
        style={{ marginTop: 20, background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontWeight: 700, fontSize: 15, cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1 }}
      >
        {salvando ? 'Salvando...' : 'Salvar todos os templates'}
      </button>
    </div>
  )
}
