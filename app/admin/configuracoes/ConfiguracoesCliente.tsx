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

function parseVal(v: string) { try { return JSON.parse(v) } catch { return v } }

export default function ConfiguracoesCliente({ configs }: { configs: Config[] }) {
  const getValor = (chave: string) => { const v = configs.find(c => c.chave === chave)?.valor ?? ''; return parseVal(v) }

  const [nome, setNome] = useState(getValor('site_nome'))
  const [slogan, setSlogan] = useState(getValor('site_slogan'))
  const [logoUrl, setLogoUrl] = useState(getValor('site_logo_url'))
  const [logoMenuUrl, setLogoMenuUrl] = useState(getValor('logo_menu_url'))
  const [logoPaginaUrl, setLogoPaginaUrl] = useState(getValor('logo_pagina_url'))
  const [logoFaviconUrl, setLogoFaviconUrl] = useState(getValor('logo_favicon_url'))
  const [corPrimaria, setCorPrimaria] = useState(getValor('site_cor_primaria') || '#333687')
  const [corSecundaria, setCorSecundaria] = useState(getValor('site_cor_secundaria') || '#02A153')
  const [whatsapp, setWhatsapp] = useState(getValor('whatsapp_suporte'))
  const [planosAtivo, setPlanosAtivo] = useState(getValor('planos_ativo') === 'true' || getValor('planos_ativo') === true)
  const [dominio, setDominio] = useState(getValor('dominio_customizado'))
  // Certificado
  const [certUrl, setCertUrl] = useState(getValor('certificado_template_url'))
  const [certNomeX, setCertNomeX] = useState(getValor('certificado_nome_x') || '50')
  const [certNomeY, setCertNomeY] = useState(getValor('certificado_nome_y') || '62')
  const [certNomeTamanho, setCertNomeTamanho] = useState(getValor('certificado_nome_tamanho') || '72')
  const [certNomeCor, setCertNomeCor] = useState(getValor('certificado_nome_cor') || '#1a1a2e')
  const [certCidade, setCertCidade] = useState(getValor('certificado_cidade') || '')
  const [certDataX, setCertDataX] = useState(getValor('certificado_data_x') || '50')
  const [certDataY, setCertDataY] = useState(getValor('certificado_data_y') || '72')
  const [certDataTamanho, setCertDataTamanho] = useState(getValor('certificado_data_tamanho') || '36')
  const [certDataCor, setCertDataCor] = useState(getValor('certificado_data_cor') || '#1a1a2e')
  const [logoMobileUrl, setLogoMobileUrl] = useState(getValor('logo_mobile_url'))
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')
  const [uploading, setUploading] = useState<string | null>(null)

  const refs = {
    logoUrl: useRef<HTMLInputElement>(null),
    logoMenuUrl: useRef<HTMLInputElement>(null),
    logoPaginaUrl: useRef<HTMLInputElement>(null),
    logoFaviconUrl: useRef<HTMLInputElement>(null),
    certUrl: useRef<HTMLInputElement>(null),
    logoMobileUrl: useRef<HTMLInputElement>(null),
  }

  const setters: Record<string, (v: string) => void> = {
    logoUrl: setLogoUrl,
    logoMenuUrl: setLogoMenuUrl,
    logoPaginaUrl: setLogoPaginaUrl,
    logoFaviconUrl: setLogoFaviconUrl,
    certUrl: setCertUrl,
    logoMobileUrl: setLogoMobileUrl,
  }

  async function uploadLogo(campo: string, file: File) {
    setUploading(campo)
    setMsg('')
    const ext = file.name.split('.').pop() || 'png'
    const path = `logos/${campo}-${Date.now()}.${ext}`

    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'artes')
    formData.append('path', path)

    const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
    const data = await res.json()

    if (!res.ok || !data.url) {
      setMsg(`Erro no upload: ${data.error || 'Tente novamente.'}`)
      setUploading(null)
      return
    }

    setters[campo]?.(data.url)
    setMsg('✅ Logo enviada! Clique em Salvar para confirmar.')
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
      { chave: 'logo_mobile_url', valor: logoMobileUrl },
      { chave: 'certificado_template_url', valor: certUrl },
      { chave: 'certificado_nome_x', valor: certNomeX },
      { chave: 'certificado_nome_y', valor: certNomeY },
      { chave: 'certificado_nome_tamanho', valor: certNomeTamanho },
      { chave: 'certificado_nome_cor', valor: certNomeCor },
      { chave: 'certificado_cidade', valor: certCidade },
      { chave: 'certificado_data_x', valor: certDataX },
      { chave: 'certificado_data_y', valor: certDataY },
      { chave: 'certificado_data_tamanho', valor: certDataTamanho },
      { chave: 'certificado_data_cor', valor: certDataCor },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 700 }}>

      {/* LOGO — destaque visual */}
      <div style={{ ...sectionStyle, border: '2px dashed var(--avp-border)' }}>
        <p style={{ fontWeight: 800, fontSize: 16 }}>🖼️ Logo da empresa</p>

        {/* Web */}
        <div style={{ background: 'var(--avp-black)', borderRadius: 8, padding: '10px 14px', marginBottom: 4 }}>
          <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>🖥️ Versão Web (horizontal)</p>
          <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 2 }}>Logo em formato paisagem para desktop — use PNG com fundo transparente</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { label: 'Logo principal', campo: 'logoUrl', value: logoUrl, setValue: setLogoUrl, desc: 'Fallback geral do sistema', rec: '400×120px', formato: 'PNG transparente' },
            { label: 'Logo do menu lateral', campo: 'logoMenuUrl', value: logoMenuUrl, setValue: setLogoMenuUrl, desc: 'Sidebar do painel admin/gestor', rec: '200×56px', formato: 'PNG transparente' },
            { label: 'Logo da página de login', campo: 'logoPaginaUrl', value: logoPaginaUrl, setValue: setLogoPaginaUrl, desc: 'Tela de login e captação', rec: '300×90px', formato: 'PNG transparente' },
          ].map(({ label, campo, value, setValue, desc, rec, formato }) => {
            const ref = refs[campo as keyof typeof refs]
            return (
              <div key={campo} style={{ background: 'var(--avp-black)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14 }}>{label}</p>
                  <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginTop: 2 }}>{desc}</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, background: 'rgba(2,161,83,0.12)', border: '1px solid rgba(2,161,83,0.3)', borderRadius: 6, padding: '3px 8px' }}>
                    <span style={{ fontSize: 11, color: 'var(--avp-green)', fontWeight: 700 }}>📐 {rec}</span>
                    <span style={{ fontSize: 10, color: 'var(--avp-text-dim)' }}>· {formato}</span>
                  </div>
                </div>

                {/* Preview */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 100, background: 'var(--avp-card)', borderRadius: 8, border: `2px dashed ${value ? 'var(--avp-green)' : 'var(--avp-border)'}`, overflow: 'hidden', flexDirection: 'column', gap: 4, padding: 8 }}>
                  {value ? (
                    <>
                      <img
                        src={value}
                        alt={label}
                        style={{ maxHeight: 76, maxWidth: '100%', objectFit: 'contain' }}
                        onLoad={e => {
                          const img = e.target as HTMLImageElement
                          const span = img.parentElement?.querySelector('.dim-label') as HTMLElement
                          if (span) span.textContent = `${img.naturalWidth}×${img.naturalHeight}px`
                          img.style.display = 'block'
                        }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      <span className="dim-label" style={{ fontSize: 10, color: 'var(--avp-green)', fontWeight: 600, fontFamily: 'monospace' }}></span>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 28, marginBottom: 4 }}>🖼️</div>
                      <span style={{ color: 'var(--avp-text-dim)', fontSize: 12 }}>Nenhuma imagem</span>
                      <br />
                      <span style={{ color: 'var(--avp-text-dim)', fontSize: 11 }}>Tamanho ideal: <strong style={{ color: 'var(--avp-text)' }}>{rec}</strong></span>
                    </div>
                  )}
                </div>

                <input type="file" accept="image/*" style={{ display: 'none' }} ref={ref}
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) {
                      const reader = new FileReader()
                      reader.onload = ev => setValue(ev.target?.result as string)
                      reader.readAsDataURL(f)
                      uploadLogo(campo, f)
                    }
                    e.target.value = ''
                  }}
                />
                <button onClick={() => ref?.current?.click()} disabled={uploading === campo}
                  style={{ background: uploading === campo ? 'var(--avp-border)' : value ? '#02A15390' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', cursor: uploading === campo ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, width: '100%' }}>
                  {uploading === campo ? '⏳ Enviando...' : value ? '🔄 Trocar imagem' : '📤 Subir imagem'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Mobile */}
        <div style={{ background: 'var(--avp-black)', borderRadius: 8, padding: '10px 14px', marginTop: 8, marginBottom: 4 }}>
          <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>📱 Versão Mobile (ícone quadrado)</p>
          <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 2 }}>Logos quadradas para celular, aba do navegador e atalho de tela inicial</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { label: 'Ícone mobile / PWA', campo: 'logoMobileUrl', value: logoMobileUrl, setValue: setLogoMobileUrl, desc: 'Atalho de tela inicial e app mobile', rec: '512×512px', formato: 'PNG quadrado' },
            { label: 'Favicon (aba do navegador)', campo: 'logoFaviconUrl', value: logoFaviconUrl, setValue: setLogoFaviconUrl, desc: 'Ícone na aba do navegador', rec: '64×64px', formato: 'PNG quadrado' },
          ].map(({ label, campo, value, setValue, desc, rec, formato }) => {
            const ref = refs[campo as keyof typeof refs]
            return (
              <div key={campo} style={{ background: 'var(--avp-black)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14 }}>{label}</p>
                  <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginTop: 2 }}>{desc}</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, background: 'rgba(2,161,83,0.12)', border: '1px solid rgba(2,161,83,0.3)', borderRadius: 6, padding: '3px 8px' }}>
                    <span style={{ fontSize: 11, color: 'var(--avp-green)', fontWeight: 700 }}>📐 {rec}</span>
                    <span style={{ fontSize: 10, color: 'var(--avp-text-dim)' }}>· {formato}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 100, background: 'var(--avp-card)', borderRadius: 8, border: `2px dashed ${value ? 'var(--avp-green)' : 'var(--avp-border)'}`, overflow: 'hidden', flexDirection: 'column', gap: 4, padding: 8 }}>
                  {value ? (
                    <>
                      <img src={value} alt={label} style={{ maxHeight: 76, maxWidth: '100%', objectFit: 'contain' }}
                        onLoad={e => { const img = e.target as HTMLImageElement; const span = img.parentElement?.querySelector('.dim-label') as HTMLElement; if (span) span.textContent = `${img.naturalWidth}×${img.naturalHeight}px` }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      <span className="dim-label" style={{ fontSize: 10, color: 'var(--avp-green)', fontWeight: 600, fontFamily: 'monospace' }}></span>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 28, marginBottom: 4 }}>📱</div>
                      <span style={{ color: 'var(--avp-text-dim)', fontSize: 12 }}>Nenhuma imagem</span><br />
                      <span style={{ color: 'var(--avp-text-dim)', fontSize: 11 }}>Tamanho ideal: <strong style={{ color: 'var(--avp-text)' }}>{rec}</strong></span>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" style={{ display: 'none' }} ref={ref}
                  onChange={e => { const f = e.target.files?.[0]; if (f) { const reader = new FileReader(); reader.onload = ev => setValue(ev.target?.result as string); reader.readAsDataURL(f); uploadLogo(campo, f) } e.target.value = '' }}
                />
                <button onClick={() => ref?.current?.click()} disabled={uploading === campo}
                  style={{ background: uploading === campo ? 'var(--avp-border)' : value ? '#02A15390' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', cursor: uploading === campo ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, width: '100%' }}>
                  {uploading === campo ? '⏳ Enviando...' : value ? '🔄 Trocar imagem' : '📤 Subir imagem'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div style={sectionStyle}>
        <p style={{ fontWeight: 700, fontSize: 15 }}>🏷️ Identidade</p>
        <div><label style={labelStyle}>Nome do site</label><input style={{ ...inputStyle, width: '100%' }} value={nome} onChange={e => setNome(e.target.value)} /></div>
        <div><label style={labelStyle}>Slogan</label><input style={{ ...inputStyle, width: '100%' }} value={slogan} onChange={e => setSlogan(e.target.value)} /></div>
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

      {/* CERTIFICADO */}
      <div style={{ ...sectionStyle, border: '2px dashed var(--avp-border)' }}>
        <p style={{ fontWeight: 800, fontSize: 16 }}>🎓 Certificado de Conclusão</p>
        <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginTop: -8 }}>
          O aluno recebe um popup com o certificado gerado automaticamente ao concluir 100% da formação. Use PNG em alta resolução (mínimo 2480×1748px — A4 paisagem) com o espaço do nome em branco.
        </p>

        {/* Upload template */}
        <div style={{ background: 'var(--avp-black)', borderRadius: 10, padding: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Template do certificado (PNG)</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input style={{ ...inputStyle, flex: 1 }} value={certUrl} onChange={e => setCertUrl(e.target.value)} placeholder="Cole a URL ou use o botão de upload" />
            <input type="file" accept="image/png,image/jpeg" style={{ display: 'none' }} ref={refs.certUrl}
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo('certUrl', f); e.target.value = '' }}
            />
            <button onClick={() => refs.certUrl?.current?.click()} disabled={uploading === 'certUrl'}
              style={{ background: uploading === 'certUrl' ? 'var(--avp-border)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 14px', cursor: uploading === 'certUrl' ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {uploading === 'certUrl' ? '⏳' : '📤 Subir'}
            </button>
          </div>
          {certUrl && (
            <img src={certUrl} alt="Template certificado" style={{ marginTop: 12, width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--avp-border)' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          )}
        </div>

        {/* Posição do nome */}
        <div>
          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>📝 Posição do nome do aluno</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'X (%)', value: certNomeX, set: setCertNomeX },
              { label: 'Y (%)', value: certNomeY, set: setCertNomeY },
              { label: 'Tamanho (px)', value: certNomeTamanho, set: setCertNomeTamanho },
              { label: 'Cor', value: certNomeCor, set: setCertNomeCor },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label style={labelStyle}>{label}</label>
                {label === 'Cor'
                  ? <div style={{ display: 'flex', gap: 6 }}>
                      <input type="color" value={value} onChange={e => set(e.target.value)} style={{ width: 38, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2, background: 'transparent' }} />
                      <input style={inputStyle} value={value} onChange={e => set(e.target.value)} />
                    </div>
                  : <input type="number" style={inputStyle} value={value} onChange={e => set(e.target.value)} />
                }
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 8 }}>X e Y são % da largura/altura. O nome é centralizado horizontalmente no ponto X.</p>
        </div>

        {/* Cidade e data */}
        <div>
          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>📅 Cidade e data de conclusão</p>
          <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginBottom: 12 }}>Aparece como: <strong style={{ color: 'var(--avp-text)' }}>Sua Cidade, 09 de maio de 2026</strong> — a data é gerada automaticamente no dia da geração do certificado.</p>
          <div>
            <label style={labelStyle}>Cidade</label>
            <input style={{ ...inputStyle, width: '100%', marginBottom: 12 }} value={certCidade} onChange={e => setCertCidade(e.target.value)} placeholder="Ex: Juazeiro do Norte - CE" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'X (%)', value: certDataX, set: setCertDataX },
              { label: 'Y (%)', value: certDataY, set: setCertDataY },
              { label: 'Tamanho (px)', value: certDataTamanho, set: setCertDataTamanho },
              { label: 'Cor', value: certDataCor, set: setCertDataCor },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label style={labelStyle}>{label}</label>
                {label === 'Cor'
                  ? <div style={{ display: 'flex', gap: 6 }}>
                      <input type="color" value={value} onChange={e => set(e.target.value)} style={{ width: 38, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2, background: 'transparent' }} />
                      <input style={inputStyle} value={value} onChange={e => set(e.target.value)} />
                    </div>
                  : <input type="number" style={inputStyle} value={value} onChange={e => set(e.target.value)} />
                }
              </div>
            ))}
          </div>
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
