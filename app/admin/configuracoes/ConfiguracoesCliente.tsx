'use client'
import { useState } from 'react'

type Config = { chave: string; valor: string; descricao?: string }

export default function ConfiguracoesCliente({ configs }: { configs: Config[] }) {
  const getValor = (chave: string) => configs.find(c => c.chave === chave)?.valor ?? ''

  const [nome, setNome] = useState(getValor('site_nome'))
  const [slogan, setSlogan] = useState(getValor('site_slogan'))
  const [logoUrl, setLogoUrl] = useState(getValor('site_logo_url'))
  const [corPrimaria, setCorPrimaria] = useState(getValor('site_cor_primaria') || '#333687')
  const [corSecundaria, setCorSecundaria] = useState(getValor('site_cor_secundaria') || '#02A153')
  const [whatsapp, setWhatsapp] = useState(getValor('whatsapp_suporte'))
  const [planosAtivo, setPlanosAtivo] = useState(getValor('planos_ativo') === 'true')
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')

  async function salvar() {
    setSalvando(true)
    setMsg('')
    const body = [
      { chave: 'site_nome', valor: nome },
      { chave: 'site_slogan', valor: slogan },
      { chave: 'site_logo_url', valor: logoUrl },
      { chave: 'site_cor_primaria', valor: corPrimaria },
      { chave: 'site_cor_secundaria', valor: corSecundaria },
      { chave: 'whatsapp_suporte', valor: whatsapp },
      { chave: 'planos_ativo', valor: String(planosAtivo) },
    ]
    const res = await fetch('/api/admin/configuracoes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSalvando(false)
    if (res.ok) {
      setMsg('Configurações salvas com sucesso!')
    } else {
      const json = await res.json().catch(() => ({}))
      setMsg(json.error ?? 'Erro ao salvar.')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--avp-black)',
    border: '1px solid var(--avp-border)',
    borderRadius: 8,
    padding: '10px 12px',
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
    fontWeight: 500,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>
      <div>
        <label style={labelStyle}>Nome do site</label>
        <input style={inputStyle} value={nome} onChange={e => setNome(e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>Slogan</label>
        <input style={inputStyle} value={slogan} onChange={e => setSlogan(e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>URL da logo (vazio = /logo.png)</label>
        <input style={inputStyle} value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="/logo.png" />
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Cor primária</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="color"
              value={corPrimaria}
              onChange={e => setCorPrimaria(e.target.value)}
              style={{ width: 44, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2, background: 'transparent' }}
            />
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={corPrimaria}
              onChange={e => setCorPrimaria(e.target.value)}
            />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Cor secundária</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="color"
              value={corSecundaria}
              onChange={e => setCorSecundaria(e.target.value)}
              style={{ width: 44, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2, background: 'transparent' }}
            />
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={corSecundaria}
              onChange={e => setCorSecundaria(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div>
        <label style={labelStyle}>WhatsApp suporte (com DDD, sem +55)</label>
        <input style={inputStyle} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="11999999999" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          type="checkbox"
          id="planosAtivo"
          checked={planosAtivo}
          onChange={e => setPlanosAtivo(e.target.checked)}
          style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--avp-green)' }}
        />
        <label htmlFor="planosAtivo" style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>
          Página de planos ativa
        </label>
      </div>
      {msg && (
        <p style={{ fontSize: 14, color: msg.includes('sucesso') ? 'var(--avp-green)' : 'var(--avp-danger)' }}>
          {msg}
        </p>
      )}
      <button
        onClick={salvar}
        disabled={salvando}
        style={{
          background: 'var(--grad-brand)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '12px 24px',
          fontWeight: 700,
          fontSize: 15,
          cursor: salvando ? 'not-allowed' : 'pointer',
          opacity: salvando ? 0.7 : 1,
          alignSelf: 'flex-start',
        }}
      >
        {salvando ? 'Salvando...' : 'Salvar configurações'}
      </button>
    </div>
  )
}
