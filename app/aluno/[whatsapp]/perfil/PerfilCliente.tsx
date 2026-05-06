'use client'
import { useState, useRef } from 'react'

type Aluno = {
  id: string
  nome: string
  whatsapp: string
  email: string
  foto_url: string | null
  bio: string | null
  status: string
}

export default function PerfilCliente({ aluno, email }: { aluno: Aluno; email: string }) {
  const [nome, setNome] = useState(aluno.nome)
  const [bio, setBio] = useState(aluno.bio ?? '')
  const [fotoUrl, setFotoUrl] = useState<string | null>(aluno.foto_url)
  const [salvando, setSalvando] = useState(false)
  const [uploadando, setUploadando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
  const inputFotoRef = useRef<HTMLInputElement>(null)

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    setFotoUrl(preview)
    setUploadando(true)
    const formData = new FormData()
    formData.append('foto', file)
    const res = await fetch('/api/perfil/foto', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.url) {
      setFotoUrl(data.url)
      setMsg({ tipo: 'ok', texto: 'Foto atualizada com sucesso!' })
    } else {
      setMsg({ tipo: 'err', texto: data.error ?? 'Erro ao fazer upload da foto.' })
    }
    setUploadando(false)
    setTimeout(() => setMsg(null), 4000)
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    const res = await fetch('/api/perfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aluno_id: aluno.id, nome, bio }),
    })
    const data = await res.json()
    if (data.ok) {
      setMsg({ tipo: 'ok', texto: 'Perfil atualizado com sucesso!' })
    } else {
      setMsg({ tipo: 'err', texto: data.error ?? 'Erro ao salvar.' })
    }
    setSalvando(false)
    setTimeout(() => setMsg(null), 4000)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--avp-black)',
    border: '1px solid var(--avp-border)',
    borderRadius: 8,
    padding: '10px 14px',
    color: 'var(--avp-text)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: 'var(--avp-text-dim)',
    fontSize: 13,
    marginBottom: 6,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ background: 'var(--avp-card)', borderBottom: '1px solid var(--avp-border)', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 800, fontSize: 20, background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Uni AVP
        </span>
        <a href={`/aluno/${aluno.whatsapp}`} style={{ color: 'var(--avp-text-dim)', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>
          ← Voltar
        </a>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 32 }}>
        <div style={{ background: 'var(--grad-brand)', borderRadius: '16px 16px 0 0', padding: '32px 32px 48px', marginBottom: -24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Meu Perfil</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>Gerencie suas informações pessoais</p>
        </div>

        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32 }}>
          {msg && (
            <div style={{ padding: '12px 16px', background: msg.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 14, marginBottom: 24 }}>
              {msg.texto}
            </div>
          )}

          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div style={{ position: 'relative' }}>
                {fotoUrl ? (
                  <img
                    src={fotoUrl}
                    alt="Foto de perfil"
                    style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--avp-border)' }}
                  />
                ) : (
                  <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 700, color: '#fff', border: '3px solid var(--avp-border)' }}>
                    {aluno.nome.charAt(0).toUpperCase()}
                  </div>
                )}
                {uploadando && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff' }}>
                    ...
                  </div>
                )}
              </div>
              <button
                onClick={() => inputFotoRef.current?.click()}
                disabled={uploadando}
                style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
              >
                Trocar foto
              </button>
              <input
                ref={inputFotoRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFoto}
              />
            </div>

            <form onSubmit={salvar} style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Nome</label>
                <input
                  style={inputStyle}
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>WhatsApp</label>
                <input
                  style={{ ...inputStyle, color: 'var(--avp-text-dim)', cursor: 'not-allowed' }}
                  value={aluno.whatsapp}
                  readOnly
                  tabIndex={-1}
                />
              </div>
              <div>
                <label style={labelStyle}>E-mail</label>
                <input
                  style={{ ...inputStyle, color: 'var(--avp-text-dim)', cursor: 'not-allowed' }}
                  value={email}
                  readOnly
                  tabIndex={-1}
                />
              </div>
              <div>
                <label style={labelStyle}>Bio</label>
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Conte um pouco sobre você..."
                  rows={3}
                />
              </div>
              <button
                type="submit"
                disabled={salvando}
                style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14, opacity: salvando ? 0.6 : 1, alignSelf: 'flex-start' }}
              >
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
