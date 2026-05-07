'use client'
import { useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Config = { chave: string; valor: string; descricao?: string }

function supabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default function ConfiguracoesCliente({ configs }: { configs: Config[] }) {
  const getValor = (chave: string) => configs.find(c => c.chave === chave)?.valor ?? ''

  const [nome, setNome] = useState(getValor('site_nome'))
  const [slogan, setSlogan] = useState(getValor('site_slogan'))
  const [logoUrl, setLogoUrl] = useState(getValor('site_logo_url'))
  const [logoMenuUrl, setLogoMenuUrl] = useState(getValor('logo_menu_url'))
  const [logoPaginaUrl, setLogoPaginaUrl] = useState(getValor('logo_pagina_url'))
  const [logoFaviconUrl, setLogoFaviconUrl] = useState(getValor('logo_favicon_url'))
  const [corPrimaria, setCorPrimaria] = useState(getValor('site_cor_primaria') || '#333687')
  const [corSecundaria, setCorSecundaria] = useState(getValor('site_cor_secundaria') || '#02A153')
  const [whatsapp, setWhatsapp] = useState(getValor('whatsapp_suporte'))
  const [planosAtivo, setPlanosAtivo] = useState(getValor('planos_ativo') === 'true')
  const [dominio, setDominio] = useState(getValor('dominio_customizado'))
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')
  const [uploading, setUploading] = useState<string | null>(null)

  const refs = {
    logoUrl: useRef<HTMLInputElement>(null),
    logoMenuUrl: useRef<HTMLInputElement>(null),
    logoPaginaUrl: useRef<HTMLInputElement>(null),
    logoFaviconUrl: useRef<HTMLInputElement>(null),
  }

  const setters: Record<string, (v: string) => void> = {
    logoUrl: setLogoUrl,
    logoMenuUrl: setLogoMenuUrl,
    logoPaginaUrl: setLogoPaginaUrl,
    logoFaviconUrl: setLogoFaviconUrl,
  }

  async function uploadLogo(campo: string, file: File) {
    setUploading(campo)
    setMsg('')
    const ext = file.name.split('.').pop() || 'png'
    const path = `logos/${campo}-${Date.now()}.${ext}`
    const sb = supabase()
    const { error } = await sb.storage.from('artes').upload(path, file, { upsert: true, contentType: file.type })
    if (error) {
      setMsg(`Erro no upload: ${error.message}. Verifique se o bucket "artes" existe e é público.`)
      setUploading(null)
      return
    }
    const { data: { publicUrl } } = sb.storage.from('artes').getPublicUrl(path)
    setters[campo]?.(publicUrl)
    setMsg('Logo enviada! Clique em Salvar para confirmar.')
    setUploading(null)
  }

  async function salvar() {
    setSalvando(true)
    setMsg('')
    const body = [
      { chave: 'site_nome', valor: nome },
      { chave: 'site_slogan', valor: slogan },
      { chave: 'site_logo_url', valor: logoUrl },
      { chave: 'logo_menu_url', valor: logoMenuUrl },
      { chave: 'logo_pagina_url', valor: logoPaginaUrl },
      { chave: 'logo_favicon_url', valor: logoFaviconUrl },
      { chave: 'site_cor_primaria', valor: corPrimaria },
      { chave: 'site_cor_secundaria', valor: corSecundaria },
      { chave: 'whatsapp_suporte', valor: whatsapp },
      { chave: 'planos_ativo', valor: String(planosAtivo) },
      { chave: 'dominio_customizado', valor: dominio },
    ]
    const res = await fetch('/api/admin/configuracoes', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSalvando(false)
    setMsg(res.ok ? 'Configurações salvas com sucesso!' : 'Erro ao salvar.')
  }

  const inputStyle: React.CSSProperties = {
    flex: 1, background: 'var(--avp-black)', border: '1px solid var(--avp-border)',
    borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6, fontWeight: 500 }
  const sectionStyle: React.CSSProperties = { background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }

  function LogoField({ label, campo, value, setValue }: { label: string; campo: string; value: string; setValue: (v: string) => void }) {
    const ref = refs[campo as keyof typeof refs]
    return (
      <div>
        <label style={labelStyle}>{label}</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input style={inputStyle} value={value} onChange={e => setValue(e.target.value)} placeholder="Cole a URL ou use o botão de upload" />
          <input type="file" accept="image/*" style={{ display: 'none' }} ref={ref}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(campo, f); e.target.value = '' }}
          />
          <button
            onClick={() => ref?.current?.click()}
            disabled={uploading === campo}
            title="Subir imagem"
            style={{ background: uploading === campo ? 'var(--avp-border)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 14px', cursor: uploading === campo ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            {uploading === campo ? '⏳' : '📤 Subir'}
          </button>
          {value && (
            <img src={value} alt="" style={{ height: 36, width: 36, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--avp-border)', flexShrink: 0 }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>

      <div style={sectionStyle}>
        <p style={{ fontWeight: 700, fontSize: 15 }}>Identidade</p>
        <div><label style={labelStyle}>Nome do site</label><input style={{ ...inputStyle, width: '100%' }} value={nome} onChange={e => setNome(e.target.value)} /></div>
        <div><label style={labelStyle}>Slogan</label><input style={{ ...inputStyle, width: '100%' }} value={slogan} onChange={e => setSlogan(e.target.value)} /></div>
      </div>

      <div style={sectionStyle}>
        <p style={{ fontWeight: 700, fontSize: 15 }}>Logos</p>
        <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginTop: -8 }}>
          Use o botão <strong>📤 Subir</strong> para fazer upload direto, ou cole a URL. O bucket "artes" no Supabase Storage precisa estar público.
        </p>
        <LogoField label="Logo padrão (fallback geral)" campo="logoUrl" value={logoUrl} setValue={setLogoUrl} />
        <LogoField label="Logo do menu / cabeçalho" campo="logoMenuUrl" value={logoMenuUrl} setValue={setLogoMenuUrl} />
        <LogoField label="Logo das páginas (login, captação)" campo="logoPaginaUrl" value={logoPaginaUrl} setValue={setLogoPaginaUrl} />
        <LogoField label="Logo do favicon (aba do navegador)" campo="logoFaviconUrl" value={logoFaviconUrl} setValue={setLogoFaviconUrl} />
      </div>

      <div style={sectionStyle}>
        <p style={{ fontWeight: 700, fontSize: 15 }}>Cores</p>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'Cor primária', value: corPrimaria, set: setCorPrimaria },
            { label: 'Cor secundária', value: corSecundaria, set: setCorSecundaria },
          ].map(({ label, value, set }) => (
            <div key={label} style={{ flex: 1 }}>
              <label style={labelStyle}>{label}</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="color" value={value} onChange={e => set(e.target.value)}
                  style={{ width: 44, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2, background: 'transparent' }} />
                <input style={inputStyle} value={value} onChange={e => set(e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Domínio personalizado */}
      <div style={sectionStyle}>
        <p style={{ fontWeight: 700, fontSize: 15 }}>🌐 Domínio personalizado</p>
        <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginTop: -8 }}>
          Configure o domínio da sua empresa para acessar a plataforma (ex: <strong>universidade.suaempresa.com.br</strong>).
        </p>
        <div>
          <label style={labelStyle}>Seu domínio</label>
          <input
            style={{ ...inputStyle, width: '100%' }}
            value={dominio}
            onChange={e => setDominio(e.target.value.trim())}
            placeholder="Ex: universidade.suaempresa.com.br"
          />
        </div>
        {dominio && (
          <div style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '16px 18px' }}>
            <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>📋 Instruções para ativar o domínio:</p>
            <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginBottom: 12 }}>
              No painel DNS do seu domínio (Cloudflare, Registro.br, etc), adicione este registro:
            </p>
            <div style={{ background: 'var(--avp-card)', borderRadius: 8, padding: '12px 14px', fontFamily: 'monospace', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ color: 'var(--avp-text-dim)', minWidth: 70 }}>Tipo:</span>
                <span style={{ color: 'var(--avp-green)', fontWeight: 700 }}>CNAME</span>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ color: 'var(--avp-text-dim)', minWidth: 70 }}>Nome:</span>
                <span style={{ color: 'var(--avp-text)', fontWeight: 700 }}>
                  {dominio.includes('.') ? dominio.split('.')[0] : dominio}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ color: 'var(--avp-text-dim)', minWidth: 70 }}>Destino:</span>
                <span style={{ color: 'var(--avp-text)', fontWeight: 700 }}>universidade.oito7digital.com.br</span>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ color: 'var(--avp-text-dim)', minWidth: 70 }}>Proxy:</span>
                <span style={{ color: 'var(--avp-text-dim)' }}>Desligado (nuvem cinza)</span>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginTop: 10 }}>
              ⚠️ Após salvar e configurar o DNS, avise a equipe Oito7 Digital para ativar o domínio no servidor. Pode levar até 24h para propagar.
            </p>
          </div>
        )}
      </div>

      <div style={sectionStyle}>
        <p style={{ fontWeight: 700, fontSize: 15 }}>Outros</p>
        <div><label style={labelStyle}>WhatsApp suporte (com DDD, sem +55)</label><input style={{ ...inputStyle, width: '100%' }} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="11999999999" /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input type="checkbox" id="planosAtivo" checked={planosAtivo} onChange={e => setPlanosAtivo(e.target.checked)}
            style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--avp-green)' }} />
          <label htmlFor="planosAtivo" style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>Página de planos ativa</label>
        </div>
      </div>

      {msg && (
        <p style={{ fontSize: 14, color: msg.includes('sucesso') || msg.includes('enviada') ? 'var(--avp-green)' : 'var(--avp-danger)' }}>
          {msg}
        </p>
      )}

      <button onClick={salvar} disabled={salvando}
        style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 700, fontSize: 15, cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1, alignSelf: 'flex-start' }}
      >
        {salvando ? 'Salvando...' : 'Salvar configurações'}
      </button>
    </div>
  )
}
