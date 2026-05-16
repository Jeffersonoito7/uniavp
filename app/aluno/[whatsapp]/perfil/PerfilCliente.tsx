'use client'
import { useState, useRef, useEffect } from 'react'
import ImageCropModal from '@/app/components/ImageCropModal'

type Aluno = {
  id: string
  nome: string
  whatsapp: string
  email: string
  foto_url: string | null
  bio: string | null
  status: string
  numero_registro?: number | null
  data_formacao?: string | null
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  ativo:      { label: 'Ativo',      color: '#02A153', bg: '#02A15315' },
  concluido:  { label: 'Formado',    color: '#6366f1', bg: '#6366f115' },
  pausado:    { label: 'Pausado',    color: '#f59e0b', bg: '#f59e0b15' },
  desligado:  { label: 'Desligado',  color: '#ef4444', bg: '#ef444415' },
}

export default function PerfilCliente({ aluno, email }: { aluno: Aluno; email: string }) {
  const [siteNome, setSiteNome] = useState('')
  useEffect(() => {
    fetch('/api/site-config').then(r => r.json()).then(d => setSiteNome(d.nome)).catch(() => {})
  }, [])

  const [nome, setNome]     = useState(aluno.nome)
  const [bio, setBio]       = useState(aluno.bio ?? '')
  const [fotoUrl, setFotoUrl] = useState<string | null>(aluno.foto_url)
  const [salvando, setSalvando]   = useState(false)
  const [uploadando, setUploadando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)

  // Crop state
  const [cropSrc, setCropSrc]     = useState<string | null>(null)
  const [showCrop, setShowCrop]   = useState(false)
  const inputFotoRef = useRef<HTMLInputElement>(null)

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCropSrc(URL.createObjectURL(file))
    setShowCrop(true)
    e.target.value = ''
  }

  async function handleCropSave(_dataUrl: string, blob: Blob) {
    setShowCrop(false)
    setFotoUrl(_dataUrl)
    setUploadando(true)
    const fd = new FormData()
    fd.append('foto', blob, 'foto.jpg')
    const res = await fetch('/api/perfil/foto', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) { setFotoUrl(data.url); setMsg({ tipo: 'ok', texto: 'Foto atualizada!' }) }
    else setMsg({ tipo: 'err', texto: data.error ?? 'Erro ao salvar foto.' })
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
    if (data.ok) setMsg({ tipo: 'ok', texto: 'Perfil atualizado!' })
    else setMsg({ tipo: 'err', texto: data.error ?? 'Erro ao salvar.' })
    setSalvando(false)
    setTimeout(() => setMsg(null), 4000)
  }

  const inp: React.CSSProperties = {
    width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)',
    borderRadius: 10, padding: '11px 14px', color: 'var(--avp-text)',
    fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
  }
  const statusInfo = STATUS_LABEL[aluno.status] ?? STATUS_LABEL.ativo

  return (
    <>
      {showCrop && cropSrc && (
        <ImageCropModal
          src={cropSrc}
          circular
          title="Ajustar foto de perfil"
          onSave={handleCropSave}
          onCancel={() => setShowCrop(false)}
        />
      )}

      <div style={{ minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>

        {/* Header */}
        <header style={{ background: 'var(--avp-card)', borderBottom: '1px solid var(--avp-border)', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 800, fontSize: 18, background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {siteNome}
          </span>
          <a href={`/aluno/${aluno.whatsapp}`} style={{ color: 'var(--avp-text-dim)', fontSize: 14, textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Voltar ao painel
          </a>
        </header>

        <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 60px' }}>

          {/* Banner + avatar */}
          <div style={{ background: 'var(--grad-brand)', borderRadius: '16px 16px 0 0', height: 120, position: 'relative', marginBottom: 60 }}>
            <div style={{ position: 'absolute', bottom: -52, left: 28, display: 'flex', alignItems: 'flex-end', gap: 16 }}>
              {/* Avatar com botão de edição */}
              <div style={{ position: 'relative' }}>
                <div style={{ width: 104, height: 104, borderRadius: '50%', border: '4px solid var(--avp-black)', overflow: 'hidden', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  onClick={() => inputFotoRef.current?.click()} title="Clique para trocar foto">
                  {fotoUrl
                    ? <img src={fotoUrl} alt={nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 40, fontWeight: 800, color: '#fff' }}>{nome.charAt(0).toUpperCase()}</span>
                  }
                  {uploadando && (
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <SpinnerCircle />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => inputFotoRef.current?.click()}
                  style={{ position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: '50%', background: 'var(--avp-green)', border: '2px solid var(--avp-black)', color: '#fff', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
                  title="Trocar foto"
                >
                  📷
                </button>
                <input ref={inputFotoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFotoChange} />
              </div>
            </div>
          </div>

          {/* Info rápida */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <span style={{ background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.color}40`, borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>
              {statusInfo.label}
            </span>
            {aluno.numero_registro && (
              <span style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: 'var(--avp-text-dim)', fontWeight: 600 }}>
                Nº {String(aluno.numero_registro).padStart(6, '0')}
              </span>
            )}
            {aluno.status === 'concluido' && (
              <a href={`/aluno/${aluno.whatsapp}/carteira`} style={{ background: '#fbbf2420', border: '1px solid #fbbf2460', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: '#fbbf24', fontWeight: 700, textDecoration: 'none' }}>
                🎓 Ver Carteira
              </a>
            )}
          </div>

          {msg && (
            <div style={{ padding: '12px 16px', background: msg.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 10, color: msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 14, marginBottom: 20 }}>
              {msg.texto}
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={salvar} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--avp-border)' }}>
              <h2 style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>Dados pessoais</h2>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, margin: '4px 0 0' }}>Edite suas informações cadastrais</p>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Nome completo *</label>
                <input style={inp} value={nome} onChange={e => setNome(e.target.value)} required placeholder="Seu nome completo" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>WhatsApp</label>
                  <input style={{ ...inp, opacity: 0.6, cursor: 'not-allowed' }} value={aluno.whatsapp} readOnly tabIndex={-1} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>E-mail</label>
                  <input style={{ ...inp, opacity: 0.6, cursor: 'not-allowed' }} value={email} readOnly tabIndex={-1} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Bio</label>
                <textarea style={{ ...inp, resize: 'vertical', minHeight: 90, lineHeight: 1.6 }} value={bio} onChange={e => setBio(e.target.value)} placeholder="Fale um pouco sobre você..." />
              </div>

              {aluno.data_formacao && (
                <div style={{ background: '#6366f115', border: '1px solid #6366f130', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 22 }}>🎓</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#818cf8', margin: 0 }}>Formado em {new Date(aluno.data_formacao + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                    <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>Consultor certificado Autovale Prevenções</p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4, borderTop: '1px solid var(--avp-border)' }}>
                <a href={`/aluno/${aluno.whatsapp}`}
                  style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                  Cancelar
                </a>
                <button type="submit" disabled={salvando}
                  style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 28px', fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: salvando ? 0.7 : 1 }}>
                  {salvando ? 'Salvando...' : '✓ Salvar alterações'}
                </button>
              </div>
            </div>
          </form>

          {/* Segurança */}
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, overflow: 'hidden', marginTop: 20 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--avp-border)' }}>
              <h2 style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>🔐 Segurança</h2>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 4px' }}>Senha</p>
                <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, margin: 0 }}>Altere sua senha de acesso</p>
              </div>
              <a href="/recuperar-senha"
                style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', color: 'var(--avp-text)', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                Alterar senha
              </a>
            </div>
          </div>
        </div>
      </div>

    </>
  )
}

function SpinnerCircle() {
  const [deg, setDeg] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setDeg(d => (d + 12) % 360), 33)
    return () => clearInterval(id)
  }, [])
  return (
    <div style={{ width: 24, height: 24, border: '3px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', transform: `rotate(${deg}deg)` }} />
  )
}
