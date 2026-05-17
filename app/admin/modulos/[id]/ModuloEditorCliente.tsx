'use client'
import { useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AulasCliente from './AulasCliente'

type Modulo = {
  id: string; titulo: string; descricao: string | null; capa_url: string | null; ordem: number; publicado: boolean
  cert_ativo?: boolean; cert_template_url?: string | null; cert_nome_y?: number; cert_nome_tamanho?: number; cert_nome_cor?: string
  cert_logo_esq_url?: string | null; cert_logo_dir_url?: string | null; cert_logo_y?: number; cert_logo_tam?: number
  cert_assinatura_url?: string | null; cert_assinatura_nome?: string | null; cert_assinatura_cargo?: string | null; cert_assinatura_y?: number
}
type Aula = { id: string; titulo: string; descricao: string | null; ordem: number; youtube_video_id: string; duracao_minutos: number | null; quiz_qtd_questoes: number; quiz_aprovacao_minima: number; espera_horas: number; publicado: boolean; ao_vivo_link: string | null; ao_vivo_data: string | null; ao_vivo_plataforma: string | null; validade_meses: number | null; capa_url: string | null; video_url: string | null; liberacao_modo: 'automatico' | 'manual_gestor' | 'manual_admin'; quiz_tipo: 'obrigatorio' | 'indicativo' | 'sim_nao'; quiz_sim_nao_pergunta?: string | null }

type Aba = 'geral' | 'aulas' | 'configuracoes' | 'certificado'

export default function ModuloEditorCliente({ modulo: inicial, aulas }: { modulo: Modulo; aulas: Aula[] }) {
  const searchParams = useSearchParams()
  const abaInicial = (searchParams.get('aba') as Aba | null) ?? 'geral'
  const [aba, setAba] = useState<Aba>(abaInicial)
  const [modulo, setModulo] = useState(inicial)
  const [titulo, setTitulo] = useState(inicial.titulo)
  const [descricao, setDescricao] = useState(inicial.descricao ?? '')
  const [ordem, setOrdem] = useState(String(inicial.ordem))
  const [publicado, setPublicado] = useState(inicial.publicado)
  const [capaPreview, setCapaPreview] = useState<string | null>(
    inicial.capa_url?.startsWith('data:') || inicial.capa_url?.startsWith('blob:') ? inicial.capa_url : null
  )
  const [capaBase64, setCapaBase64] = useState<string | null>(
    inicial.capa_url?.startsWith('data:') ? inicial.capa_url : null
  )
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Certificado por módulo ──
  const [certAtivo, setCertAtivo] = useState(inicial.cert_ativo ?? false)
  const [certTemplateUrl, setCertTemplateUrl] = useState(inicial.cert_template_url ?? '')
  const [certNomeY, setCertNomeY] = useState(String(inicial.cert_nome_y ?? 52))
  const [certNomeTamanho, setCertNomeTamanho] = useState(String(inicial.cert_nome_tamanho ?? 8))
  const [certNomeCor, setCertNomeCor] = useState(inicial.cert_nome_cor ?? '#1a1a2e')
  const [certLogoEsqUrl, setCertLogoEsqUrl] = useState(inicial.cert_logo_esq_url ?? '')
  const [certLogoDirUrl, setCertLogoDirUrl] = useState(inicial.cert_logo_dir_url ?? '')
  const [certLogoY, setCertLogoY] = useState(String(inicial.cert_logo_y ?? 15))
  const [certLogoTam, setCertLogoTam] = useState(String(inicial.cert_logo_tam ?? 22))
  const [certAssinaturaUrl, setCertAssinaturaUrl] = useState(inicial.cert_assinatura_url ?? '')
  const [certAssinaturaNome, setCertAssinaturaNome] = useState(inicial.cert_assinatura_nome ?? '')
  const [certAssinaturaCargo, setCertAssinaturaCargo] = useState(inicial.cert_assinatura_cargo ?? '')
  const [certAssinaturaY, setCertAssinaturaY] = useState(String(inicial.cert_assinatura_y ?? 75))
  const [certAssinaturaAtiva, setCertAssinaturaAtiva] = useState(!!(inicial.cert_assinatura_url))
  const [certUploading, setCertUploading] = useState('')
  const certTemplateRef = useRef<HTMLInputElement>(null)
  const certLogoEsqRef = useRef<HTMLInputElement>(null)
  const certLogoDirRef = useRef<HTMLInputElement>(null)
  const certAssinaturaRef = useRef<HTMLInputElement>(null)

  async function uploadCertImg(campo: string, file: File) {
    setCertUploading(campo)
    const maxSize = campo === 'template' ? 8 * 1024 * 1024 : 2 * 1024 * 1024
    if (file.size > maxSize) { setMsg({ tipo: 'err', texto: `Arquivo muito grande. Limite: ${campo === 'template' ? '8MB' : '2MB'}` }); setCertUploading(''); return }
    const ext = file.name.split('.').pop() || 'png'
    const path = `modulo_${modulo.id}_cert_${campo}.${ext}`
    const form = new FormData()
    form.append('file', file)
    form.append('bucket', 'logos')
    form.append('path', path)
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok || !data.url) { setMsg({ tipo: 'err', texto: data.error ?? 'Erro no upload' }); setCertUploading(''); return }
      const url = data.url + '?t=' + Date.now()
      if (campo === 'template') setCertTemplateUrl(url)
      else if (campo === 'logo_esq') setCertLogoEsqUrl(url)
      else if (campo === 'logo_dir') setCertLogoDirUrl(url)
      else if (campo === 'assinatura') setCertAssinaturaUrl(url)
      setMsg({ tipo: 'ok', texto: 'Imagem enviada! Clique em "Salvar módulo" para confirmar.' })
    } catch { setMsg({ tipo: 'err', texto: 'Erro no upload' }) }
    setCertUploading('')
  }

  const inp: React.CSSProperties = { width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6, fontWeight: 500 }
  const card: React.CSSProperties = { background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24 }

  function selecionarCapa(file: File) {
    if (file.size > 3 * 1024 * 1024) { setMsg({ tipo: 'err', texto: 'Máximo 3MB.' }); return }
    setCapaPreview(URL.createObjectURL(file))
    const reader = new FileReader()
    reader.onload = ev => setCapaBase64(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function salvar() {
    setSalvando(true); setMsg(null)
    const res = await fetch('/api/admin/modulos', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: modulo.id, titulo, descricao: descricao || null,
        capa_url: capaBase64 || modulo.capa_url || null,
        ordem: parseInt(ordem) || modulo.ordem, publicado,
        cert_ativo: certAtivo,
        cert_template_url: certTemplateUrl || null,
        cert_nome_y: parseInt(certNomeY) || 52,
        cert_nome_tamanho: parseInt(certNomeTamanho) || 8,
        cert_nome_cor: certNomeCor || '#1a1a2e',
        cert_logo_esq_url: certLogoEsqUrl || null,
        cert_logo_dir_url: certLogoDirUrl || null,
        cert_logo_y: parseInt(certLogoY) || 15,
        cert_logo_tam: parseInt(certLogoTam) || 22,
        cert_assinatura_url: certAssinaturaUrl || null,
        cert_assinatura_nome: certAssinaturaNome || null,
        cert_assinatura_cargo: certAssinaturaCargo || null,
        cert_assinatura_y: parseInt(certAssinaturaY) || 75,
      }),
    })
    const data = await res.json()
    if (data.modulo) {
      setModulo(data.modulo)
      setMsg({ tipo: 'ok', texto: 'Módulo salvo com sucesso!' })
    } else {
      setMsg({ tipo: 'err', texto: data.error ?? 'Erro ao salvar.' })
    }
    setSalvando(false)
    setTimeout(() => setMsg(null), 3000)
  }

  const abas: { id: Aba; label: string }[] = [
    { id: 'geral', label: 'Geral' },
    { id: 'aulas', label: 'Aulas' },
    { id: 'configuracoes', label: 'Configurações' },
    { id: 'certificado', label: '🎓 Certificado' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* ── Cabeçalho estilo Kiwify ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--avp-border)' }}>
        <Link href="/admin/modulos" style={{ color: 'var(--avp-text-dim)', fontSize: 22, textDecoration: 'none', lineHeight: 1 }}>←</Link>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginBottom: 2 }}>Editar Módulo</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--avp-text)', margin: 0 }}>{titulo || 'Sem título'}</h1>
        </div>
        <button onClick={salvar} disabled={salvando}
          style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: 14, cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1 }}>
          {salvando ? 'Salvando...' : 'Salvar módulo'}
        </button>
      </div>

      {msg && (
        <div style={{ padding: '10px 16px', background: msg.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 14, marginBottom: 16 }}>
          {msg.texto}
        </div>
      )}

      {/* ── Abas estilo Kiwify ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '2px solid var(--avp-border)' }}>
        {abas.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            style={{ background: 'none', border: 'none', borderBottom: `3px solid ${aba === a.id ? 'var(--avp-blue)' : 'transparent'}`, marginBottom: -2, padding: '10px 20px', cursor: 'pointer', fontWeight: aba === a.id ? 700 : 500, fontSize: 14, color: aba === a.id ? 'var(--avp-text)' : 'var(--avp-text-dim)' }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ── Aba Geral ── */}
      {aba === 'geral' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={card}>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Informações do módulo</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={lbl}>Título *</label>
                  <input style={inp} value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Nome do módulo" />
                </div>
                <div>
                  <label style={lbl}>Descrição</label>
                  <textarea style={{ ...inp, minHeight: 90, resize: 'vertical' }} value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descreva o conteúdo do módulo..." />
                </div>
              </div>
            </div>
          </div>

          {/* Coluna lateral */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={card}>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Status</p>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={publicado} onChange={e => setPublicado(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--avp-green)', cursor: 'pointer' }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: publicado ? 'var(--avp-green)' : 'var(--avp-text-dim)' }}>
                  {publicado ? 'Publicado' : 'Rascunho'}
                </span>
              </label>
              <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginTop: 8 }}>
                {publicado ? 'Visível para consultores ativos.' : 'Não aparece para os consultores.'}
              </p>
            </div>

            <div style={card}>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
                Capa do módulo
                <span style={{ fontSize: 11, color: 'var(--avp-green)', fontWeight: 700, marginLeft: 8 }}>1380×1080px</span>
              </p>
              <div onClick={() => fileRef.current?.click()}
                style={{ cursor: 'pointer', borderRadius: 8, overflow: 'hidden', border: `2px dashed ${capaPreview ? 'var(--avp-green)' : 'var(--avp-border)'}`, background: 'var(--avp-black)', aspectRatio: '1380/1080', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                {capaPreview
                  ? <img src={capaPreview} alt="capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 32, color: 'var(--avp-text-dim)' }}>🖼️</span>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) selecionarCapa(f); e.target.value = '' }} />
              <button onClick={() => fileRef.current?.click()}
                style={{ width: '100%', background: capaPreview ? 'var(--avp-green)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                {capaPreview ? '🔄 Trocar capa' : '📤 Subir capa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Aba Aulas ── */}
      {aba === 'aulas' && (
        <AulasCliente moduloId={modulo.id} aulasIniciais={aulas} />
      )}

      {/* ── Aba Certificado ── */}
      {aba === 'certificado' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>

          {/* Toggle ativar */}
          <div style={{ ...card, border: '2px dashed var(--avp-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <p style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>🎓 Certificado deste módulo</p>
                <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginTop: 6 }}>
                  Quando ativado, o aluno recebe um certificado exclusivo ao concluir todas as aulas deste módulo.
                </p>
              </div>
              <button onClick={() => setCertAtivo(v => !v)}
                style={{ flexShrink: 0, width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', background: certAtivo ? 'var(--avp-green)' : 'var(--avp-border)', position: 'relative', transition: 'background 0.2s' }}>
                <span style={{ position: 'absolute', top: 4, left: certAtivo ? 28 : 4, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </button>
            </div>
          </div>

          {certAtivo && (<>

            {/* Template + Preview + Posição — tudo num card só */}
            <div style={card}>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Template do certificado</p>
              <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginBottom: 12 }}>
                <strong style={{ color: 'var(--avp-green)' }}>📐 2480×1748px · A4 paisagem · mín. 150 dpi</strong>
              </p>

              {/* Botões de upload */}
              <input ref={certTemplateRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadCertImg('template', f); e.target.value = '' }} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={() => certTemplateRef.current?.click()} disabled={certUploading === 'template'}
                  style={{ flex: 1, background: certUploading === 'template' ? 'var(--avp-border)' : certTemplateUrl ? 'var(--avp-green)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                  {certUploading === 'template' ? '⏳ Enviando...' : certTemplateUrl ? '🔄 Trocar template' : '📤 Subir template'}
                </button>
                {certTemplateUrl && <button onClick={() => setCertTemplateUrl('')}
                  style={{ background: '#e6394620', border: '1px solid #e6394640', color: 'var(--avp-danger)', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>🗑</button>}
              </div>

              {/* Preview grande com nome sobreposto — sempre visível quando tem template */}
              {certTemplateUrl ? (
                <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '2px solid var(--avp-green)', marginBottom: 20, containerType: 'inline-size' as any }}>
                  <img src={certTemplateUrl} alt="preview" style={{ width: '100%', display: 'block' }} />
                  <div style={{
                    position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                    top: `${certNomeY}%`, width: '80%', textAlign: 'center' as const,
                    fontFamily: 'Georgia, serif', fontWeight: 700,
                    fontSize: `${Math.min(Number(certNomeTamanho) || 4.5, 6)}cqw`,
                    color: certNomeCor, textTransform: 'uppercase' as const,
                    letterSpacing: 2, pointerEvents: 'none' as const, lineHeight: 1.2,
                    textShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  }}>
                    NOME DO ALUNO
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 120, background: 'var(--avp-black)', borderRadius: 8, border: '2px dashed var(--avp-border)', marginBottom: 20 }}>
                  <span style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>📄 Faça upload para ver o preview</span>
                </div>
              )}

              {/* Controles de posição ABAIXO do preview */}
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, borderTop: '1px solid var(--avp-border)', paddingTop: 16 }}>Posição do nome do aluno</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Posição vertical (%)</label>
                  <input type="number" min={0} max={100} style={inp} value={certNomeY} onChange={e => setCertNomeY(e.target.value)} />
                  <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>0 = topo · 100 = base · padrão: 63</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Tamanho fonte (%)</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input type="number" min={1} max={8} step={0.1} style={{ ...inp, flex: 1 }} value={certNomeTamanho} onChange={e => setCertNomeTamanho(e.target.value)} />
                    <button onClick={() => setCertNomeTamanho('4.5')} style={{ background: 'var(--avp-border)', border: 'none', borderRadius: 8, padding: '0 10px', color: 'var(--avp-text-dim)', fontSize: 11, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' as const }}>Padrão</button>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>% da largura · padrão: 4.5</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Cor do nome</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" value={certNomeCor} onChange={e => setCertNomeCor(e.target.value)} style={{ width: 44, height: 40, borderRadius: 6, border: '1px solid var(--avp-border)', background: 'none', cursor: 'pointer', padding: 2 }} />
                    <input style={{ ...inp, flex: 1 }} value={certNomeCor} onChange={e => setCertNomeCor(e.target.value)} placeholder="#1a1a2e" />
                  </div>
                </div>
              </div>
            </div>

            {/* Logos */}
            <div style={card}>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Logomarcas (opcional)</p>
              <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginBottom: 14 }}>PNG com fundo transparente.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                {/* Logo esquerda */}
                {[
                  { label: 'Logo esquerda', campo: 'logo_esq', val: certLogoEsqUrl, setVal: setCertLogoEsqUrl, ref: certLogoEsqRef },
                  { label: 'Logo direita', campo: 'logo_dir', val: certLogoDirUrl, setVal: setCertLogoDirUrl, ref: certLogoDirRef },
                ].map(({ label, campo, val, setVal, ref }) => (
                  <div key={campo} style={{ background: 'var(--avp-black)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{label}</p>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 70, background: 'var(--avp-card)', borderRadius: 8, border: `2px dashed ${val ? 'var(--avp-green)' : 'var(--avp-border)'}`, padding: 6 }}>
                      {val ? <img src={val} alt={label} style={{ maxHeight: 56, maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ color: 'var(--avp-text-dim)', fontSize: 11 }}>PNG transparente</span>}
                    </div>
                    <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadCertImg(campo, f); e.target.value = '' }} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => ref.current?.click()} disabled={certUploading === campo}
                        style={{ flex: 1, background: certUploading === campo ? 'var(--avp-border)' : val ? 'var(--avp-green)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                        {certUploading === campo ? '⏳' : val ? '🔄 Trocar' : '📤 Subir'}
                      </button>
                      {val && <button onClick={() => setVal('')} style={{ background: '#e6394620', border: '1px solid #e6394640', color: 'var(--avp-danger)', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>🗑</button>}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Posição vertical dos logos (%)</label>
                  <input type="number" min={0} max={100} style={inp} value={certLogoY} onChange={e => setCertLogoY(e.target.value)} />
                  <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>0 = topo · 100 = base · padrão: 88</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Tamanho dos logos (%)</label>
                  <input type="number" min={1} max={30} step={0.5} style={inp} value={certLogoTam} onChange={e => setCertLogoTam(e.target.value)} />
                  <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>% da altura · padrão: 10</p>
                </div>
              </div>
            </div>

            {/* Assinatura */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: certAssinaturaAtiva ? 16 : 0 }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>✍️ Sobrepor assinatura no certificado</p>
                  <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '4px 0 0', lineHeight: 1.5 }}>
                    Ative <strong>somente</strong> se o template <strong>não</strong> tiver assinatura gravada.
                  </p>
                </div>
                <button onClick={() => setCertAssinaturaAtiva(v => !v)}
                  style={{ flexShrink: 0, width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: certAssinaturaAtiva ? 'var(--avp-green)' : 'var(--avp-border)', position: 'relative', transition: 'background 0.2s' }}>
                  <span style={{ position: 'absolute', top: 3, left: certAssinaturaAtiva ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </button>
              </div>
              {certAssinaturaAtiva && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ background: 'var(--avp-black)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>Assinatura do Presidente (PNG transparente)</p>
                      <span style={{ fontSize: 11, color: 'var(--avp-green)', fontWeight: 700 }}>📐 PNG transparente · 400×150px</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 70, background: 'var(--avp-card)', borderRadius: 8, border: `2px dashed ${certAssinaturaUrl ? 'var(--avp-green)' : 'var(--avp-border)'}`, padding: 6 }}>
                      {certAssinaturaUrl ? <img src={certAssinaturaUrl} alt="assinatura" style={{ maxHeight: 56, maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ color: 'var(--avp-text-dim)', fontSize: 12 }}>Nenhuma assinatura</span>}
                    </div>
                    <input ref={certAssinaturaRef} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadCertImg('assinatura', f); e.target.value = '' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => certAssinaturaRef.current?.click()} disabled={certUploading === 'assinatura'}
                        style={{ flex: 1, background: certUploading === 'assinatura' ? 'var(--avp-border)' : certAssinaturaUrl ? 'var(--avp-green)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                        {certUploading === 'assinatura' ? '⏳ Enviando...' : certAssinaturaUrl ? '🔄 Trocar' : '📤 Subir assinatura'}
                      </button>
                      {certAssinaturaUrl && <button onClick={() => setCertAssinaturaUrl('')} style={{ background: '#e6394620', border: '1px solid #e6394640', color: 'var(--avp-danger)', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>🗑</button>}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Nome de quem assina</label>
                      <input style={inp} value={certAssinaturaNome} onChange={e => setCertAssinaturaNome(e.target.value)} placeholder="Ex: TIBURCIO FILHO" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Cargo</label>
                      <input style={inp} value={certAssinaturaCargo} onChange={e => setCertAssinaturaCargo(e.target.value)} placeholder="Ex: PRESIDENTE" />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Posição vertical da assinatura (%)</label>
                    <input type="number" min={0} max={100} style={inp} value={certAssinaturaY} onChange={e => setCertAssinaturaY(e.target.value)} />
                    <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>0 = topo · 100 = base · padrão: 82</p>
                  </div>
                </div>
              )}
            </div>


          </>)}
        </div>
      )}

      {/* ── Aba Configurações ── */}
      {aba === 'configuracoes' && (
        <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={card}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Ordenação</p>
            <div>
              <label style={lbl}>Posição do módulo</label>
              <input type="number" style={inp} value={ordem} min={1}
                onChange={e => setOrdem(e.target.value)} />
              <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginTop: 6 }}>
                Módulos são exibidos em ordem crescente para os consultores.
              </p>
            </div>
          </div>
          <div style={card}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Zona de perigo</p>
            <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginBottom: 16 }}>
              Excluir o módulo remove todas as aulas e o progresso dos consultores neste módulo.
            </p>
            <button onClick={async () => {
              if (!confirm(`Excluir o módulo "${titulo}"? Esta ação não pode ser desfeita.`)) return
              const res = await fetch('/api/admin/modulos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: modulo.id }) })
              if (res.ok) window.location.href = '/admin/modulos'
            }} style={{ background: 'var(--avp-danger)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              Excluir módulo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
