'use client'
import { useRef, useState } from 'react'

type Config = { chave: string; valor: string; descricao?: string }

function LogoCard({ label, campo, value, desc, rec, fileRef, uploading, onUpload }: {
  label: string; campo: string; value: string; desc: string; rec: string
  fileRef: React.RefObject<HTMLInputElement>; uploading: string
  onUpload: (campo: string, file: File) => void
}) {
  // Mostra preview só para base64 ou blob URL (locais) — ignora URLs http antigas
  const isLocal = value?.startsWith('data:') || value?.startsWith('blob:')
  const temImagem = isLocal

  return (
    <div style={{ background: 'var(--avp-black)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <p style={{ fontWeight: 700, fontSize: 13 }}>{label}</p>
        <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 2 }}>{desc}</p>
        <span style={{ fontSize: 11, color: 'var(--avp-green)', fontWeight: 700 }}>📐 {rec}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 90, background: 'var(--avp-card)', borderRadius: 8, border: `2px dashed ${temImagem ? 'var(--avp-green)' : 'var(--avp-border)'}`, padding: 8, flexDirection: 'column', gap: 4 }}>
        {temImagem ? (
          <img src={value} alt={label} style={{ maxHeight: 74, maxWidth: '100%', objectFit: 'contain' }} />
        ) : (
          <span style={{ color: 'var(--avp-text-dim)', fontSize: 12, textAlign: 'center' }}>
            {value && !isLocal ? '📤 Suba a imagem novamente' : `Nenhuma imagem · ideal: ${rec}`}
          </span>
        )}
      </div>
      <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileRef}
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(campo, f); e.target.value = '' }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading === campo}
        style={{ background: uploading === campo ? 'var(--avp-border)' : temImagem ? 'var(--avp-green)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', cursor: 'pointer', fontSize: 13, fontWeight: 700, width: '100%', opacity: uploading === campo ? 0.7 : 1 }}>
        {uploading === campo ? '⏳ Lendo arquivo...' : temImagem ? '🔄 Trocar imagem' : '📤 Subir imagem'}
      </button>
    </div>
  )
}

function parseVal(v: string) {
  try { return JSON.parse(v) } catch { return v }
}

export default function ConfiguracoesCliente({ configs }: { configs: Config[] }) {
  function get(chave: string, def = '') {
    const v = configs.find(c => c.chave === chave)?.valor ?? def
    const parsed = parseVal(v)
    return typeof parsed === 'string' ? parsed : String(parsed)
  }

  const [logoUrl, setLogoUrl] = useState(get('site_logo_url'))
  const [logoMenuUrl, setLogoMenuUrl] = useState(get('logo_menu_url'))
  const [logoPaginaUrl, setLogoPaginaUrl] = useState(get('logo_pagina_url'))
  const [logoFaviconUrl, setLogoFaviconUrl] = useState(get('logo_favicon_url'))
  const [logoMobileUrl, setLogoMobileUrl] = useState(get('logo_mobile_url'))
  const [nome, setNome] = useState(get('site_nome'))
  const [slogan, setSlogan] = useState(get('site_slogan'))
  const [corPrimaria, setCorPrimaria] = useState(get('site_cor_primaria') || '#333687')
  const [corSecundaria, setCorSecundaria] = useState(get('site_cor_secundaria') || '#02A153')
  const [whatsapp, setWhatsapp] = useState(get('whatsapp_suporte'))
  const [dominio, setDominio] = useState(get('dominio_customizado'))
  const [certUrl, setCertUrl] = useState(get('certificado_template_url'))
  const [certNomeX, setCertNomeX] = useState(get('certificado_nome_x') || '50')
  const [certNomeY, setCertNomeY] = useState(get('certificado_nome_y') || '62')
  const [certNomeTamanho, setCertNomeTamanho] = useState(get('certificado_nome_tamanho') || '72')
  const [certNomeCor, setCertNomeCor] = useState(get('certificado_nome_cor') || '#1a1a2e')
  const [certCidade, setCertCidade] = useState(get('certificado_cidade'))
  const [certDataX, setCertDataX] = useState(get('certificado_data_x') || '50')
  const [certDataY, setCertDataY] = useState(get('certificado_data_y') || '72')
  const [certDataTamanho, setCertDataTamanho] = useState(get('certificado_data_tamanho') || '36')
  const [certDataCor, setCertDataCor] = useState(get('certificado_data_cor') || '#1a1a2e')
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')
  const [uploading, setUploading] = useState('')

  const logoUrlRef = useRef<HTMLInputElement>(null)
  const logoMenuUrlRef = useRef<HTMLInputElement>(null)
  const logoPaginaUrlRef = useRef<HTMLInputElement>(null)
  const logoFaviconUrlRef = useRef<HTMLInputElement>(null)
  const logoMobileUrlRef = useRef<HTMLInputElement>(null)
  const certUrlRef = useRef<HTMLInputElement>(null)

  const setters: Record<string, (v: string) => void> = {
    logoUrl: setLogoUrl,
    logoMenuUrl: setLogoMenuUrl,
    logoPaginaUrl: setLogoPaginaUrl,
    logoFaviconUrl: setLogoFaviconUrl,
    logoMobileUrl: setLogoMobileUrl,
    certUrl: setCertUrl,
  }

  const campoToChave: Record<string, string> = {
    logoUrl: 'site_logo_url',
    logoMenuUrl: 'logo_menu_url',
    logoPaginaUrl: 'logo_pagina_url',
    logoFaviconUrl: 'logo_favicon_url',
    logoMobileUrl: 'logo_mobile_url',
    certUrl: 'certificado_template_url',
  }

  async function uploadImagem(campo: string, file: File) {
    setUploading(campo)
    setMsg('')

    if (campo !== 'certUrl') {
      // Logos: salva como base64 direto no banco (sem depender de Storage público)
      if (file.size > 800 * 1024) {
        setMsg('❌ Logo muito grande. Use uma imagem de até 800KB.')
        setUploading('')
        return
      }
      const reader = new FileReader()
      reader.onload = async ev => {
        const base64 = ev.target?.result as string
        setters[campo]?.(base64)
        const chave = campoToChave[campo]
        if (chave) {
          try {
            const res = await fetch('/api/admin/configuracoes', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify([{ chave, valor: base64 }]),
            })
            setMsg(res.ok ? '✅ Logo salva!' : '❌ Erro ao salvar.')
          } catch (e: any) {
            setMsg(`❌ Erro: ${e.message}`)
          }
        }
        setUploading('')
      }
      reader.onerror = () => { setMsg('❌ Erro ao ler o arquivo'); setUploading('') }
      reader.readAsDataURL(file)
      return
    }

    // Certificado: blob URL para preview imediato (não bota base64 gigante no state)
    // depois lê como base64 para salvar no banco
    const blobUrl = URL.createObjectURL(file)
    setCertUrl(blobUrl)
    setMsg('⏳ Lendo arquivo...')

    const certReader = new FileReader()
    certReader.onload = async ev => {
      const base64 = ev.target?.result as string
      if (file.size > 8 * 1024 * 1024) {
        setMsg(`⚠️ Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Otimize o PNG para menos de 8MB.`)
        setUploading('')
        return
      }
      try {
        const res = await fetch('/api/admin/configuracoes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([{ chave: 'certificado_template_url', valor: base64 }]),
        })
        if (res.ok) {
          setCertUrl(base64) // troca blob por base64 persistido
          setMsg('✅ Template do certificado salvo!')
        } else {
          setMsg('❌ Erro ao salvar — arquivo muito grande, otimize o PNG.')
        }
      } catch (e: any) {
        setMsg(`❌ Erro: ${e.message}`)
      }
      setUploading('')
    }
    certReader.onerror = () => { setMsg('❌ Erro ao ler o arquivo'); setUploading('') }
    certReader.readAsDataURL(file)
  }

  async function salvar() {
    setSalvando(true)
    setMsg('')
    try {
      const body = [
        { chave: 'site_nome', valor: nome },
        { chave: 'site_slogan', valor: slogan },
        { chave: 'site_logo_url', valor: logoUrl },
        { chave: 'logo_menu_url', valor: logoMenuUrl },
        { chave: 'logo_pagina_url', valor: logoPaginaUrl },
        { chave: 'logo_favicon_url', valor: logoFaviconUrl },
        { chave: 'logo_mobile_url', valor: logoMobileUrl },
        { chave: 'site_cor_primaria', valor: corPrimaria },
        { chave: 'site_cor_secundaria', valor: corSecundaria },
        { chave: 'whatsapp_suporte', valor: whatsapp },
        { chave: 'dominio_customizado', valor: dominio },
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setMsg(res.ok ? '✅ Configurações salvas com sucesso!' : '❌ Erro ao salvar.')
    } catch (e: any) {
      setMsg(`❌ Erro: ${e.message}`)
    }
    setSalvando(false)
  }

  const inp: React.CSSProperties = { width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6, fontWeight: 500 }
  const card: React.CSSProperties = { background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 700 }}>

      {/* LOGOS */}
      <div style={{ ...card, border: '2px dashed var(--avp-border)' }}>
        <p style={{ fontWeight: 800, fontSize: 16 }}>🖼️ Logo da empresa</p>
        <div style={{ background: 'var(--avp-black)', borderRadius: 8, padding: '8px 12px' }}>
          <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>🖥️ Versão Web (horizontal)</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <LogoCard label="Logo principal" campo="logoUrl" value={logoUrl} desc="Fallback geral" rec="400×120px" fileRef={logoUrlRef} uploading={uploading} onUpload={uploadImagem} />
          <LogoCard label="Logo do menu lateral" campo="logoMenuUrl" value={logoMenuUrl} desc="Sidebar admin/gestor" rec="200×56px" fileRef={logoMenuUrlRef} uploading={uploading} onUpload={uploadImagem} />
          <LogoCard label="Logo da página de login" campo="logoPaginaUrl" value={logoPaginaUrl} desc="Login e captação" rec="300×90px" fileRef={logoPaginaUrlRef} uploading={uploading} onUpload={uploadImagem} />
        </div>
        <div style={{ background: 'var(--avp-black)', borderRadius: 8, padding: '8px 12px', marginTop: 8 }}>
          <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>📱 Versão Mobile (quadrado)</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <LogoCard label="Ícone mobile / PWA" campo="logoMobileUrl" value={logoMobileUrl} desc="Tela inicial do celular" rec="512×512px" fileRef={logoMobileUrlRef} uploading={uploading} onUpload={uploadImagem} />
          <LogoCard label="Favicon" campo="logoFaviconUrl" value={logoFaviconUrl} desc="Aba do navegador" rec="64×64px" fileRef={logoFaviconUrlRef} uploading={uploading} onUpload={uploadImagem} />
        </div>
      </div>

      {/* IDENTIDADE */}
      <div style={card}>
        <p style={{ fontWeight: 700, fontSize: 15 }}>🏷️ Identidade</p>
        <div><label style={lbl}>Nome do site</label><input style={inp} value={nome} onChange={e => setNome(e.target.value)} /></div>
        <div><label style={lbl}>Slogan</label><input style={inp} value={slogan} onChange={e => setSlogan(e.target.value)} /></div>
      </div>

      {/* CORES */}
      <div style={card}>
        <p style={{ fontWeight: 700, fontSize: 15 }}>🎨 Cores</p>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'Cor primária', value: corPrimaria, set: setCorPrimaria },
            { label: 'Cor secundária', value: corSecundaria, set: setCorSecundaria },
          ].map(({ label, value, set }) => (
            <div key={label} style={{ flex: 1 }}>
              <label style={lbl}>{label}</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={value} onChange={e => set(e.target.value)} style={{ width: 44, height: 40, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2, background: 'transparent' }} />
                <input style={inp} value={value} onChange={e => set(e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DOMÍNIO */}
      <div style={card}>
        <p style={{ fontWeight: 700, fontSize: 15 }}>🌐 Domínio personalizado</p>
        <div>
          <label style={lbl}>Seu domínio</label>
          <input style={inp} value={dominio} onChange={e => setDominio(e.target.value.trim())} placeholder="Ex: universidade.suaempresa.com.br" />
        </div>
        {dominio && (
          <div style={{ background: 'var(--avp-black)', borderRadius: 10, padding: '14px 16px', fontSize: 13 }}>
            <p style={{ fontWeight: 700, marginBottom: 8 }}>📋 Configure no DNS:</p>
            <div style={{ fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span><span style={{ color: 'var(--avp-text-dim)' }}>Tipo:</span> <strong style={{ color: 'var(--avp-green)' }}>CNAME</strong></span>
              <span><span style={{ color: 'var(--avp-text-dim)' }}>Nome:</span> <strong>{dominio.split('.')[0]}</strong></span>
              <span><span style={{ color: 'var(--avp-text-dim)' }}>Destino:</span> <strong>universidade.oito7digital.com.br</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* OUTROS */}
      <div style={card}>
        <p style={{ fontWeight: 700, fontSize: 15 }}>⚙️ Outros</p>
        <div><label style={lbl}>WhatsApp suporte</label><input style={inp} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="11999999999" /></div>
      </div>

      {/* CERTIFICADO */}
      <div style={{ ...card, border: '2px dashed var(--avp-border)' }}>
        <p style={{ fontWeight: 800, fontSize: 16 }}>🎓 Certificado de Conclusão</p>
        <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginTop: -8 }}>Template PNG em alta resolução (mínimo 2480×1748px — A4 paisagem)</p>
        <LogoCard label="Template do certificado" campo="certUrl" value={certUrl} desc="PNG com espaço em branco para o nome" rec="2480×1748px" fileRef={certUrlRef} uploading={uploading} onUpload={uploadImagem} />
        <div>
          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>📝 Posição do nome</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[['X (%)', certNomeX, setCertNomeX], ['Y (%)', certNomeY, setCertNomeY], ['Tamanho px', certNomeTamanho, setCertNomeTamanho], ['Cor', certNomeCor, setCertNomeCor]].map(([label, val, set]) => (
              <div key={label as string}>
                <label style={lbl}>{label as string}</label>
                {label === 'Cor'
                  ? <div style={{ display: 'flex', gap: 4 }}><input type="color" value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)} style={{ width: 38, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2 }} /><input style={inp} value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)} /></div>
                  : <input type="number" style={inp} value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)} />
                }
              </div>
            ))}
          </div>
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>📅 Cidade e data</p>
          <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginBottom: 10 }}>Aparece como: <strong style={{ color: 'var(--avp-text)' }}>Juazeiro do Norte - CE, 09 de maio de 2026</strong></p>
          <input style={{ ...inp, marginBottom: 12 }} value={certCidade} onChange={e => setCertCidade(e.target.value)} placeholder="Ex: Juazeiro do Norte - CE" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[['X (%)', certDataX, setCertDataX], ['Y (%)', certDataY, setCertDataY], ['Tamanho px', certDataTamanho, setCertDataTamanho], ['Cor', certDataCor, setCertDataCor]].map(([label, val, set]) => (
              <div key={label as string}>
                <label style={lbl}>{label as string}</label>
                {label === 'Cor'
                  ? <div style={{ display: 'flex', gap: 4 }}><input type="color" value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)} style={{ width: 38, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2 }} /><input style={inp} value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)} /></div>
                  : <input type="number" style={inp} value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)} />
                }
              </div>
            ))}
          </div>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', background: msg.includes('✅') ? '#02A15320' : '#e6394620', border: `1px solid ${msg.includes('✅') ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msg.includes('✅') ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 14 }}>
          {msg}
        </div>
      )}

      <button onClick={salvar} disabled={salvando}
        style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '13px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: salvando ? 0.7 : 1, alignSelf: 'flex-start' }}>
        {salvando ? '⏳ Salvando...' : '💾 Salvar configurações'}
      </button>
    </div>
  )
}
