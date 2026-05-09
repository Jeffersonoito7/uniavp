'use client'
import { useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Aula = {
  id: string
  titulo: string
  ordem: number
  youtube_video_id: string
  duracao_minutos: number | null
  quiz_qtd_questoes: number
  quiz_aprovacao_minima: number
  espera_horas: number
  publicado: boolean
  ao_vivo_link: string | null
  ao_vivo_data: string | null
  ao_vivo_plataforma: string | null
  validade_meses: number | null
}

type Arquivo = { id: string; nome: string; url: string }

function supabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function ArquivosAula({ aulaId }: { aulaId: string }) {
  const [arquivos, setArquivos] = useState<Arquivo[]>([])
  const [carregado, setCarregado] = useState(false)
  const [aberto, setAberto] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function carregar() {
    if (carregado) return
    const res = await fetch(`/api/admin/arquivos?aulaId=${aulaId}`)
    const data = await res.json()
    setArquivos(data)
    setCarregado(true)
  }

  async function toggle() {
    if (!aberto) await carregar()
    setAberto(a => !a)
  }

  async function uploadArquivo(file: File) {
    if (!nomeArquivo.trim()) { setMsg('Preencha o nome do arquivo primeiro.'); return }
    setUploading(true)
    setMsg('')
    const sb = supabase()
    const ext = file.name.split('.').pop() || 'pdf'
    const path = `aulas/arquivos/${aulaId}-${Date.now()}.${ext}`
    const { error } = await sb.storage.from('artes').upload(path, file, { upsert: true, contentType: file.type })
    if (error) { setMsg(`Erro no upload: ${error.message}`); setUploading(false); return }
    const { data: { publicUrl } } = sb.storage.from('artes').getPublicUrl(path)
    const res = await fetch('/api/admin/arquivos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aulaId, nome: nomeArquivo.trim(), url: publicUrl }),
    })
    const novo = await res.json()
    if (novo.id) {
      setArquivos(a => [...a, novo])
      setNomeArquivo('')
      setMsg('Arquivo enviado com sucesso!')
      if (fileRef.current) fileRef.current.value = ''
    }
    setUploading(false)
    setTimeout(() => setMsg(''), 3000)
  }

  async function remover(id: string) {
    await fetch('/api/admin/arquivos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setArquivos(a => a.filter(f => f.id !== id))
  }

  return (
    <div style={{ marginTop: 10 }}>
      <button
        type="button"
        onClick={toggle}
        style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 6, padding: '5px 12px', color: 'var(--avp-text-dim)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
      >
        📎 Arquivos {carregado ? `(${arquivos.length})` : ''}
      </button>

      {aberto && (
        <div style={{ marginTop: 12, background: 'var(--avp-black)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 4 }}>ARQUIVOS DA AULA</p>

          {arquivos.map(f => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <a href={f.url} target="_blank" rel="noreferrer"
                style={{ flex: 1, color: 'var(--avp-blue)', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
                📄 {f.nome}
              </a>
              <button onClick={() => remover(f.id)}
                style={{ background: 'var(--avp-danger)', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}>
                Remover
              </button>
            </div>
          ))}

          {arquivos.length === 0 && <p style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>Nenhum arquivo ainda.</p>}

          <div style={{ borderTop: '1px solid var(--avp-border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', fontWeight: 600 }}>ADICIONAR ARQUIVO</p>
            <input
              placeholder="Nome do arquivo (ex: Apostila Módulo 1)"
              value={nomeArquivo}
              onChange={e => setNomeArquivo(e.target.value)}
              style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 6, padding: '8px 12px', color: 'var(--avp-text)', fontSize: 13, outline: 'none' }}
            />
            <input type="file" ref={fileRef} style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadArquivo(f) }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{ background: uploading ? 'var(--avp-border)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, alignSelf: 'flex-start' }}
            >
              {uploading ? '⏳ Enviando...' : '📤 Selecionar e enviar arquivo'}
            </button>
            {msg && <p style={{ fontSize: 12, color: msg.includes('sucesso') ? 'var(--avp-green)' : 'var(--avp-danger)' }}>{msg}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AulasCliente({ moduloId, aulasIniciais }: { moduloId: string; aulasIniciais: Aula[] }) {
  const [aulas, setAulas] = useState<Aula[]>(aulasIniciais)
  const [criando, setCriando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [aoVivo, setAoVivo] = useState(false)
  const [form, setForm] = useState({
    titulo: '', youtube_video_id: '', duracao_minutos: '',
    quiz_qtd_questoes: 5, quiz_aprovacao_minima: 80, espera_horas: 24,
    ao_vivo_link: '', ao_vivo_data: '', ao_vivo_plataforma: 'zoom',
    validade_meses: '',
  })
  const [capaPreview, setCapaPreview] = useState<string | null>(null)
  const [capaBase64, setCapaBase64] = useState<string | null>(null)
  const [uploadandoCapa, setUploadandoCapa] = useState(false)
  const capaFileRef = useRef<HTMLInputElement>(null)

  // Edição de aula
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{
    titulo: string; youtube_video_id: string; duracao_minutos: string;
    quiz_qtd_questoes: number; quiz_aprovacao_minima: number; espera_horas: number;
    validade_meses: string; ao_vivo_link: string; ao_vivo_data: string; ao_vivo_plataforma: string;
    capaPreview: string | null; capaBase64: string | null;
  }>({ titulo: '', youtube_video_id: '', duracao_minutos: '', quiz_qtd_questoes: 5, quiz_aprovacao_minima: 80, espera_horas: 24, validade_meses: '', ao_vivo_link: '', ao_vivo_data: '', ao_vivo_plataforma: 'zoom', capaPreview: null, capaBase64: null })
  const [salvandoEdit, setSalvandoEdit] = useState(false)
  const editCapaRef = useRef<HTMLInputElement>(null)

  const [msg, setMsg] = useState('')

  function selecionarCapa(file: File, isEdit = false) {
    if (file.size > 3 * 1024 * 1024) { setMsg('Imagem muito grande. Use até 3MB.'); return }
    setUploadandoCapa(true)
    const blobUrl = URL.createObjectURL(file)
    const reader = new FileReader()
    reader.onload = ev => {
      const b64 = ev.target?.result as string
      if (isEdit) setEditForm(p => ({ ...p, capaPreview: blobUrl, capaBase64: b64 }))
      else { setCapaPreview(blobUrl); setCapaBase64(b64) }
      setUploadandoCapa(false)
    }
    reader.readAsDataURL(file)
  }

  function abrirEdicaoAula(aula: Aula) {
    const temCapa = aula.capa_url?.startsWith('data:') || aula.capa_url?.startsWith('blob:')
    setEditandoId(aula.id)
    setEditForm({
      titulo: aula.titulo, youtube_video_id: aula.youtube_video_id,
      duracao_minutos: aula.duracao_minutos?.toString() ?? '',
      quiz_qtd_questoes: aula.quiz_qtd_questoes, quiz_aprovacao_minima: aula.quiz_aprovacao_minima,
      espera_horas: aula.espera_horas, validade_meses: aula.validade_meses?.toString() ?? '',
      ao_vivo_link: aula.ao_vivo_link ?? '', ao_vivo_data: aula.ao_vivo_data ?? '',
      ao_vivo_plataforma: aula.ao_vivo_plataforma ?? 'zoom',
      capaPreview: temCapa ? aula.capa_url : null, capaBase64: temCapa ? aula.capa_url : null,
    })
  }

  async function salvarEdicaoAula(id: string) {
    setSalvandoEdit(true)
    const res = await fetch(`/api/admin/modulos/${moduloId}/aulas`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id, titulo: editForm.titulo, youtube_video_id: editForm.youtube_video_id,
        duracao_minutos: editForm.duracao_minutos ? parseInt(editForm.duracao_minutos) : null,
        quiz_qtd_questoes: editForm.quiz_qtd_questoes, quiz_aprovacao_minima: editForm.quiz_aprovacao_minima,
        espera_horas: editForm.espera_horas,
        validade_meses: editForm.validade_meses ? parseInt(editForm.validade_meses) : null,
        ao_vivo_link: editForm.ao_vivo_link || null, ao_vivo_data: editForm.ao_vivo_data || null,
        ao_vivo_plataforma: editForm.ao_vivo_link ? editForm.ao_vivo_plataforma : null,
        capa_url: editForm.capaBase64 || null,
      }),
    })
    const data = await res.json()
    if (data.aula) {
      setAulas(prev => prev.map(a => a.id === id ? data.aula : a))
      setEditandoId(null)
      setMsg('Aula atualizada!')
      setTimeout(() => setMsg(''), 3000)
    }
    setSalvandoEdit(false)
  }

  async function excluirAula(aula: Aula) {
    if (!confirm(`Excluir a aula "${aula.titulo}"?`)) return
    const res = await fetch('/api/admin/aulas', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: aula.id }),
    })
    if (res.ok) setAulas(prev => prev.filter(a => a.id !== aula.id))
  }

  async function salvarAula(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    const body: Record<string, unknown> = {
      modulo_id: moduloId,
      titulo: form.titulo,
      youtube_video_id: form.youtube_video_id,
      duracao_minutos: form.duracao_minutos ? parseInt(form.duracao_minutos) : null,
      quiz_qtd_questoes: form.quiz_qtd_questoes,
      quiz_aprovacao_minima: form.quiz_aprovacao_minima,
      espera_horas: form.espera_horas,
      validade_meses: form.validade_meses ? parseInt(form.validade_meses) : null,
      capa_url: capaBase64 || null,
    }
    if (aoVivo && form.ao_vivo_link) {
      body.ao_vivo_link = form.ao_vivo_link
      body.ao_vivo_data = form.ao_vivo_data || null
      body.ao_vivo_plataforma = form.ao_vivo_plataforma
    }
    const res = await fetch(`/api/admin/modulos/${moduloId}/aulas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.aula) {
      setAulas(a => [...a, data.aula])
      setCriando(false)
      setAoVivo(false)
      setCapaPreview(null); setCapaBase64(null)
      setForm({ titulo: '', youtube_video_id: '', duracao_minutos: '', quiz_qtd_questoes: 5, quiz_aprovacao_minima: 80, espera_horas: 24, ao_vivo_link: '', ao_vivo_data: '', ao_vivo_plataforma: 'zoom', validade_meses: '' })
      setMsg('Aula criada com sucesso!')
    }
    setSalvando(false)
    setTimeout(() => setMsg(''), 3000)
  }

  const cardStyle = { background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20 }
  const inputStyle = { width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none' }
  const labelStyle = { display: 'block' as const, color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {msg && <div style={{ padding: '12px 16px', background: '#02A15320', border: '1px solid var(--avp-green)', borderRadius: 8, color: 'var(--avp-green)', fontSize: 14 }}>{msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Aulas ({aulas.length})</h2>
        <button onClick={() => setCriando(c => !c)} style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          {criando ? 'Cancelar' : '+ Nova Aula'}
        </button>
      </div>

      {criando && (
        <form onSubmit={salvarAula} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontWeight: 700 }}>Nova Aula</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Título *</label>
              <input style={inputStyle} value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} required />
            </div>
            <div>
              <label style={labelStyle}>YouTube Video ID *</label>
              <input style={inputStyle} value={form.youtube_video_id} onChange={e => setForm(p => ({ ...p, youtube_video_id: e.target.value }))} required />
            </div>
            <div>
              <label style={labelStyle}>Duração (min)</label>
              <input type="number" style={inputStyle} value={form.duracao_minutos} onChange={e => setForm(p => ({ ...p, duracao_minutos: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Espera após aprovação (horas)</label>
              <input type="number" style={inputStyle} value={form.espera_horas} onChange={e => setForm(p => ({ ...p, espera_horas: parseInt(e.target.value) }))} />
            </div>
            <div>
              <label style={labelStyle}>Questões no quiz</label>
              <input type="number" style={inputStyle} value={form.quiz_qtd_questoes} onChange={e => setForm(p => ({ ...p, quiz_qtd_questoes: parseInt(e.target.value) }))} min={1} max={20} />
            </div>
            <div>
              <label style={labelStyle}>Aprovação mínima (%)</label>
              <input type="number" style={inputStyle} value={form.quiz_aprovacao_minima} onChange={e => setForm(p => ({ ...p, quiz_aprovacao_minima: parseInt(e.target.value) }))} min={50} max={100} />
            </div>
            <div>
              <label style={labelStyle}>Validade (meses, 0 = sem validade)</label>
              <input type="number" style={inputStyle} value={form.validade_meses} onChange={e => setForm(p => ({ ...p, validade_meses: e.target.value }))} min={0} placeholder="Opcional" />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--avp-border)', paddingTop: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: aoVivo ? 16 : 0 }}>
              <input type="checkbox" checked={aoVivo} onChange={e => setAoVivo(e.target.checked)} style={{ width: 16, height: 16 }} />
              <span style={{ color: 'var(--avp-text)', fontWeight: 600 }}>Aula ao vivo</span>
            </label>
            {aoVivo && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Link da reunião</label>
                  <input style={inputStyle} value={form.ao_vivo_link} onChange={e => setForm(p => ({ ...p, ao_vivo_link: e.target.value }))} placeholder="https://zoom.us/..." />
                </div>
                <div>
                  <label style={labelStyle}>Data e hora</label>
                  <input type="datetime-local" style={inputStyle} value={form.ao_vivo_data} onChange={e => setForm(p => ({ ...p, ao_vivo_data: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Plataforma</label>
                  <select style={inputStyle} value={form.ao_vivo_plataforma} onChange={e => setForm(p => ({ ...p, ao_vivo_plataforma: e.target.value }))}>
                    <option value="zoom">Zoom</option>
                    <option value="meet">Google Meet</option>
                    <option value="teams">Microsoft Teams</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Capa da aula */}
          <div style={{ borderTop: '1px solid var(--avp-border)', paddingTop: 16 }}>
            <label style={{ ...labelStyle, marginBottom: 10 }}>Capa da aula <span style={{ color: 'var(--avp-green)', fontSize: 11, fontWeight: 700 }}>📐 1380 × 1080 px</span></label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div onClick={() => capaFileRef.current?.click()}
                style={{ width: 120, height: 94, flexShrink: 0, borderRadius: 8, overflow: 'hidden', border: `2px dashed ${capaPreview ? 'var(--avp-green)' : 'var(--avp-border)'}`, background: 'var(--avp-black)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {capaPreview
                  ? <img src={capaPreview} alt="capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: 'var(--avp-text-dim)', fontSize: 24 }}>🖼️</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input ref={capaFileRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) selecionarCapa(f); e.target.value = '' }} />
                <button type="button" onClick={() => capaFileRef.current?.click()} disabled={uploadandoCapa}
                  style={{ background: capaPreview ? 'var(--avp-green)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: uploadandoCapa ? 0.7 : 1 }}>
                  {uploadandoCapa ? '⏳ Lendo...' : capaPreview ? '🔄 Trocar' : '📤 Subir capa'}
                </button>
                {capaPreview && (
                  <button type="button" onClick={() => { setCapaPreview(null); setCapaBase64(null) }}
                    style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>
                    Remover
                  </button>
                )}
                <p style={{ fontSize: 11, color: 'var(--avp-text-dim)' }}>PNG ou JPG · máx. 3MB</p>
              </div>
            </div>
          </div>

          <button type="submit" disabled={salvando || uploadandoCapa} style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14, alignSelf: 'flex-start' }}>
            {salvando ? 'Salvando...' : 'Criar Aula'}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {aulas.sort((a, b) => a.ordem - b.ordem).map(aula => {
          const isEditing = editandoId === aula.id
          const temCapa = aula.capa_url?.startsWith('data:') || aula.capa_url?.startsWith('blob:')
          return (
            <div key={aula.id} style={cardStyle}>
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--avp-text-dim)' }}>Editando Aula #{aula.ordem}</p>
                    <button onClick={() => setEditandoId(null)} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 20 }}>×</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><label style={labelStyle}>Título *</label><input style={inputStyle} value={editForm.titulo} onChange={e => setEditForm(p => ({ ...p, titulo: e.target.value }))} /></div>
                    <div><label style={labelStyle}>YouTube Video ID *</label><input style={inputStyle} value={editForm.youtube_video_id} onChange={e => setEditForm(p => ({ ...p, youtube_video_id: e.target.value }))} /></div>
                    <div><label style={labelStyle}>Duração (min)</label><input type="number" style={inputStyle} value={editForm.duracao_minutos} onChange={e => setEditForm(p => ({ ...p, duracao_minutos: e.target.value }))} /></div>
                    <div><label style={labelStyle}>Espera após aprovação (horas)</label><input type="number" style={inputStyle} value={editForm.espera_horas} onChange={e => setEditForm(p => ({ ...p, espera_horas: parseInt(e.target.value) }))} /></div>
                    <div><label style={labelStyle}>Questões no quiz</label><input type="number" style={inputStyle} value={editForm.quiz_qtd_questoes} onChange={e => setEditForm(p => ({ ...p, quiz_qtd_questoes: parseInt(e.target.value) }))} min={1} max={20} /></div>
                    <div><label style={labelStyle}>Aprovação mínima (%)</label><input type="number" style={inputStyle} value={editForm.quiz_aprovacao_minima} onChange={e => setEditForm(p => ({ ...p, quiz_aprovacao_minima: parseInt(e.target.value) }))} min={50} max={100} /></div>
                    <div><label style={labelStyle}>Validade (meses)</label><input type="number" style={inputStyle} value={editForm.validade_meses} onChange={e => setEditForm(p => ({ ...p, validade_meses: e.target.value }))} min={0} placeholder="0 = sem validade" /></div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--avp-border)', paddingTop: 12 }}>
                    <label style={{ ...labelStyle, marginBottom: 8 }}>Capa <span style={{ color: 'var(--avp-green)', fontSize: 11, fontWeight: 700 }}>📐 1380×1080px</span></label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div onClick={() => editCapaRef.current?.click()} style={{ width: 110, height: 86, flexShrink: 0, borderRadius: 8, overflow: 'hidden', border: `2px dashed ${editForm.capaPreview ? 'var(--avp-green)' : 'var(--avp-border)'}`, background: 'var(--avp-black)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {editForm.capaPreview ? <img src={editForm.capaPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 22, color: 'var(--avp-text-dim)' }}>🖼️</span>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <input ref={editCapaRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) selecionarCapa(f, true); e.target.value = '' }} />
                        <button type="button" onClick={() => editCapaRef.current?.click()} style={{ background: editForm.capaPreview ? 'var(--avp-green)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                          {editForm.capaPreview ? '🔄 Trocar' : '📤 Subir capa'}
                        </button>
                        {editForm.capaPreview && <button type="button" onClick={() => setEditForm(p => ({ ...p, capaPreview: null, capaBase64: null }))} style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 11 }}>Remover</button>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => salvarEdicaoAula(aula.id)} disabled={salvandoEdit}
                      style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: salvandoEdit ? 0.7 : 1 }}>
                      {salvandoEdit ? 'Salvando...' : '✓ Salvar'}
                    </button>
                    <button onClick={() => setEditandoId(null)} style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1 }}>
                      {temCapa && <img src={aula.capa_url!} alt={aula.titulo} style={{ width: 72, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <span style={{ background: 'var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>#{aula.ordem}</span>
                          <h3 style={{ fontWeight: 700, fontSize: 15 }}>{aula.titulo}</h3>
                          {aula.ao_vivo_link && <span style={{ background: '#33368720', color: '#6366f1', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>AO VIVO</span>}
                          {aula.validade_meses && <span style={{ background: '#f59e0b20', color: '#f59e0b', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>Validade: {aula.validade_meses}m</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 16, color: 'var(--avp-text-dim)', fontSize: 13 }}>
                          <span>{aula.youtube_video_id}</span>
                          {aula.duracao_minutos && <span>{aula.duracao_minutos} min</span>}
                          <span>Quiz: {aula.quiz_qtd_questoes}q / {aula.quiz_aprovacao_minima}%</span>
                          <span>Espera: {aula.espera_horas}h</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => abrirEdicaoAula(aula)}
                        style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        Editar
                      </button>
                      <button onClick={async () => {
                        const res = await fetch(`/api/admin/modulos/${moduloId}/aulas`, {
                          method: 'PUT', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: aula.id, publicado: !aula.publicado }),
                        })
                        const data = await res.json()
                        if (data.aula) setAulas(prev => prev.map(a => a.id === aula.id ? { ...a, publicado: !a.publicado } : a))
                      }} style={{ background: aula.publicado ? 'var(--avp-border)' : 'var(--avp-green)', color: aula.publicado ? 'var(--avp-text-dim)' : '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        {aula.publicado ? 'Despublicar' : 'Publicar'}
                      </button>
                      <button onClick={() => excluirAula(aula)}
                        style={{ background: '#e6394615', border: '1px solid #e6394630', color: 'var(--avp-danger)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        Excluir
                      </button>
                    </div>
                  </div>
                  <ArquivosAula aulaId={aula.id} />
                </>
              )}
            </div>
          )
        })}
        {aulas.length === 0 && !criando && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--avp-text-dim)' }}>Nenhuma aula cadastrada ainda.</div>
        )}
      </div>
    </div>
  )
}
