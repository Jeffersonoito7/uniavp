'use client'
import { useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AulasCliente from './AulasCliente'

type Modulo = { id: string; titulo: string; descricao: string | null; capa_url: string | null; ordem: number; publicado: boolean }
type Aula = { id: string; titulo: string; descricao: string | null; ordem: number; youtube_video_id: string; duracao_minutos: number | null; quiz_qtd_questoes: number; quiz_aprovacao_minima: number; espera_horas: number; publicado: boolean; ao_vivo_link: string | null; ao_vivo_data: string | null; ao_vivo_plataforma: string | null; validade_meses: number | null; capa_url: string | null; video_url: string | null; liberacao_modo: 'automatico' | 'manual_gestor' | 'manual_admin' }

type Aba = 'geral' | 'aulas' | 'configuracoes'

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
      body: JSON.stringify({ id: modulo.id, titulo, descricao: descricao || null, capa_url: capaBase64 || modulo.capa_url || null, ordem: parseInt(ordem) || modulo.ordem, publicado }),
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
