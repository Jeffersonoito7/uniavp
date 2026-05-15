'use client'
import { useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import QuestoesAula from './QuestoesAula'

type Aula = {
  id: string
  titulo: string
  descricao: string | null
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
  capa_url: string | null
  video_url: string | null
  liberacao_modo: 'automatico' | 'manual_gestor' | 'manual_admin'
  quiz_tipo: 'obrigatorio' | 'indicativo' | 'sim_nao'
  quiz_sim_nao_pergunta?: string | null
  quiz_sim_nao_nao_mensagem?: string | null
  quiz_sim_nao_perguntas?: { pergunta: string; nao_mensagem: string }[] | null
}

function extrairIdYoutube(input: string): string {
  if (!input) return ''
  const match = input.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (match) return match[1]
  // Se já é um ID direto (11 chars alfanuméricos)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim()
  return ''
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
  const [tipoVideo, setTipoVideo] = useState<'youtube' | 'arquivo' | 'url'>('youtube')
  const [videoUrl, setVideoUrl] = useState('')
  const [uploadandoVideo, setUploadandoVideo] = useState(false)
  const [progressoVideo, setProgressoVideo] = useState(0)
  const videoFileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    titulo: '', descricao: '', youtube_url: '', duracao_minutos: '',
    quiz_qtd_questoes: 5, quiz_aprovacao_minima: 80, espera_horas: 0,
    ao_vivo_link: '', ao_vivo_data: '', ao_vivo_plataforma: 'zoom',
    validade_meses: '', liberacao_modo: 'automatico' as 'automatico' | 'manual_gestor' | 'manual_admin',
    quiz_tipo: 'obrigatorio' as 'obrigatorio' | 'indicativo',
  })
  const [capaPreview, setCapaPreview] = useState<string | null>(null)
  const [capaBase64, setCapaBase64] = useState<string | null>(null)
  const [uploadandoCapa, setUploadandoCapa] = useState(false)
  const capaFileRef = useRef<HTMLInputElement>(null)

  // Edição de aula
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{
    titulo: string; descricao: string; youtube_url: string; duracao_minutos: string;
    quiz_qtd_questoes: number; quiz_aprovacao_minima: number; espera_horas: number;
    validade_meses: string; ao_vivo_link: string; ao_vivo_data: string; ao_vivo_plataforma: string;
    liberacao_modo: 'automatico' | 'manual_gestor' | 'manual_admin';
    quiz_tipo: 'obrigatorio' | 'indicativo' | 'sim_nao';
    capaPreview: string | null; capaBase64: string | null;
  }>({ titulo: '', descricao: '', youtube_url: '', duracao_minutos: '', quiz_qtd_questoes: 5, quiz_aprovacao_minima: 80, espera_horas: 0, validade_meses: '', ao_vivo_link: '', ao_vivo_data: '', ao_vivo_plataforma: 'zoom', liberacao_modo: 'automatico', quiz_tipo: 'obrigatorio', capaPreview: null, capaBase64: null })
  const [editTipoVideo, setEditTipoVideo] = useState<'youtube' | 'arquivo' | 'url'>('youtube')
  const [editVideoUrl, setEditVideoUrl] = useState('')
  const [editUploadandoVideo, setEditUploadandoVideo] = useState(false)
  const [editProgressoVideo, setEditProgressoVideo] = useState(0)
  const editVideoFileRef = useRef<HTMLInputElement>(null)
  const [salvandoEdit, setSalvandoEdit] = useState(false)
  const editCapaRef = useRef<HTMLInputElement>(null)

  const [msg, setMsg] = useState('')
  const dragAulaIndex = useRef<number | null>(null)
  const [dragAulaOver, setDragAulaOver] = useState<number | null>(null)

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

  async function uploadVideo(file: File) {
    setUploadandoVideo(true); setProgressoVideo(0); setMsg('')
    try {
      // 1. Pede URL assinada ao servidor
      const res = await fetch('/api/admin/video-upload-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name }),
      })
      const { signedUrl, publicUrl, error } = await res.json()
      if (!signedUrl) { setMsg(`Erro: ${error || 'Não foi possível gerar URL de upload'}`); setUploadandoVideo(false); return }

      // 2. Upload direto para o Supabase (sem passar pelo Vercel)
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = e => { if (e.lengthComputable) setProgressoVideo(Math.round(e.loaded / e.total * 100)) }
      xhr.open('PUT', signedUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`))
        xhr.onerror = () => reject(new Error('Erro de rede'))
        xhr.send(file)
      })

      setVideoUrl(publicUrl)
      setMsg('✅ Vídeo enviado! Clique em Criar Aula para salvar.')
    } catch (e: any) {
      setMsg(`Erro no upload: ${e.message}`)
    }
    setUploadandoVideo(false)
  }

  async function uploadVideoEdit(file: File) {
    setEditUploadandoVideo(true); setEditProgressoVideo(0)
    try {
      const res = await fetch('/api/admin/video-upload-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name }),
      })
      const { signedUrl, publicUrl, error } = await res.json()
      if (!signedUrl) { setMsg(`Erro: ${error || 'Não foi possível gerar URL de upload'}`); setEditUploadandoVideo(false); return }
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = e => { if (e.lengthComputable) setEditProgressoVideo(Math.round(e.loaded / e.total * 100)) }
      xhr.open('PUT', signedUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`))
        xhr.onerror = () => reject(new Error('Erro de rede'))
        xhr.send(file)
      })
      setEditVideoUrl(publicUrl)
      setMsg('✅ Vídeo enviado! Salve a aula para confirmar.')
    } catch (e: any) {
      setMsg(`Erro no upload: ${e.message}`)
    }
    setEditUploadandoVideo(false)
  }

  function abrirEdicaoAula(aula: Aula) {
    const temCapa = aula.capa_url?.startsWith('data:') || aula.capa_url?.startsWith('blob:')
    const tipo: 'youtube' | 'arquivo' | 'url' = aula.youtube_video_id ? 'youtube' : aula.video_url ? 'url' : 'youtube'
    setEditTipoVideo(tipo)
    setEditVideoUrl(aula.video_url ?? '')
    setEditandoId(aula.id)
    setEditForm({
      titulo: aula.titulo, descricao: aula.descricao ?? '',
      youtube_url: aula.youtube_video_id || '',
      liberacao_modo: aula.liberacao_modo ?? 'automatico',
      duracao_minutos: aula.duracao_minutos?.toString() ?? '',
      quiz_qtd_questoes: aula.quiz_qtd_questoes, quiz_aprovacao_minima: aula.quiz_aprovacao_minima,
      espera_horas: aula.espera_horas, validade_meses: aula.validade_meses?.toString() ?? '',
      ao_vivo_link: aula.ao_vivo_link ?? '', ao_vivo_data: aula.ao_vivo_data ?? '',
      ao_vivo_plataforma: aula.ao_vivo_plataforma ?? 'zoom',
      capaPreview: temCapa ? aula.capa_url : null, capaBase64: temCapa ? aula.capa_url : null,
      quiz_tipo: aula.quiz_tipo ?? 'obrigatorio',
    })
  }

  async function salvarEdicaoAula(id: string) {
    setSalvandoEdit(true)
    const res = await fetch(`/api/admin/modulos/${moduloId}/aulas`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id, titulo: editForm.titulo, descricao: editForm.descricao || null,
        youtube_video_id: editTipoVideo === 'youtube' ? extrairIdYoutube(editForm.youtube_url) : '',
        video_url: editTipoVideo !== 'youtube' ? editVideoUrl || null : null,
        duracao_minutos: editForm.duracao_minutos ? parseInt(editForm.duracao_minutos) : null,
        quiz_qtd_questoes: editForm.quiz_qtd_questoes, quiz_aprovacao_minima: editForm.quiz_aprovacao_minima,
        espera_horas: editForm.espera_horas,
        validade_meses: editForm.validade_meses ? parseInt(editForm.validade_meses) : null,
        ao_vivo_link: editForm.ao_vivo_link || null, ao_vivo_data: editForm.ao_vivo_data || null,
        ao_vivo_plataforma: editForm.ao_vivo_link ? editForm.ao_vivo_plataforma : null,
        capa_url: editForm.capaBase64 || null,
        liberacao_modo: editForm.liberacao_modo,
        quiz_tipo: editForm.quiz_tipo,
        bloquear_avancar: !!(editForm as any).bloquear_avancar,
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

  async function onDropAula(targetIdx: number) {
    const from = dragAulaIndex.current
    if (from === null || from === targetIdx) { dragAulaIndex.current = null; setDragAulaOver(null); return }
    const lista = [...aulas].sort((a, b) => a.ordem - b.ordem)
    const [moved] = lista.splice(from, 1)
    lista.splice(targetIdx, 0, moved)
    const reordenadas = lista.map((a, i) => ({ ...a, ordem: i + 1 }))
    setAulas(reordenadas)
    dragAulaIndex.current = null
    setDragAulaOver(null)
    await Promise.all(reordenadas.map(a =>
      fetch(`/api/admin/modulos/${moduloId}/aulas`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: a.id, ordem: a.ordem }),
      })
    ))
  }

  async function salvarAula(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    const body: Record<string, unknown> = {
      modulo_id: moduloId,
      titulo: form.titulo,
      descricao: form.descricao || null,
      youtube_video_id: tipoVideo === 'youtube' ? extrairIdYoutube(form.youtube_url) : '',
      video_url: tipoVideo !== 'youtube' ? videoUrl || null : null,
      duracao_minutos: form.duracao_minutos ? parseInt(form.duracao_minutos) : null,
      quiz_qtd_questoes: form.quiz_qtd_questoes,
      quiz_aprovacao_minima: form.quiz_aprovacao_minima,
      espera_horas: form.espera_horas,
      validade_meses: form.validade_meses ? parseInt(form.validade_meses) : null,
      capa_url: capaBase64 || null,
      liberacao_modo: form.liberacao_modo,
      quiz_tipo: form.quiz_tipo,
      bloquear_avancar: !!(form as any).bloquear_avancar,
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
      setTipoVideo('youtube'); setVideoUrl('')
      setForm({ titulo: '', descricao: '', youtube_url: '', duracao_minutos: '', quiz_qtd_questoes: 5, quiz_aprovacao_minima: 80, espera_horas: 0, ao_vivo_link: '', ao_vivo_data: '', ao_vivo_plataforma: 'zoom', validade_meses: '', liberacao_modo: 'automatico', quiz_tipo: 'obrigatorio' })
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
        <form onSubmit={salvarAula} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, overflow: 'hidden' }}>
          {/* Cabeçalho */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--avp-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Detalhes do conteúdo</h3>
              <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>Preencha as informações da aula</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setCriando(false)} style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Cancelar</button>
              <button type="submit" disabled={salvando || uploadandoCapa} style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 22px', fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: salvando ? 0.7 : 1 }}>
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>

          {/* Corpo: 2 colunas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px' }}>

            {/* ── Coluna esquerda: conteúdo principal ── */}
            <div style={{ padding: 24, borderRight: '1px solid var(--avp-border)', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Título *</label>
                <input style={inputStyle} value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} required placeholder="Nome da aula" />
              </div>
              <div>
                <label style={labelStyle}>Descrição</label>
                <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' as const }} value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Descreva o conteúdo desta aula..." />
              </div>

              {/* Tipo de vídeo */}
              <div>
                <label style={labelStyle}>Vídeo</label>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {(['youtube', 'arquivo', 'url'] as const).map(t => (
                    <button key={t} type="button" onClick={() => { setTipoVideo(t); setVideoUrl('') }}
                      style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tipoVideo === t ? 'var(--avp-blue)' : 'transparent', borderColor: tipoVideo === t ? 'var(--avp-blue)' : 'var(--avp-border)', color: tipoVideo === t ? '#fff' : 'var(--avp-text-dim)' }}>
                      {t === 'youtube' ? '▶ YouTube' : t === 'arquivo' ? '📁 Arquivo' : '🔗 URL / Vimeo'}
                    </button>
                  ))}
                </div>

                {tipoVideo === 'youtube' && (() => {
                  const ytId = extrairIdYoutube(form.youtube_url)
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <input style={inputStyle} placeholder="Youtube URL (ex: https://www.youtube.com/watch?v=...)" value={form.youtube_url} onChange={e => setForm(p => ({ ...p, youtube_url: e.target.value }))} />
                      {ytId && (
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 10, overflow: 'hidden', background: '#000' }}>
                          <iframe src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} />
                        </div>
                      )}
                    </div>
                  )
                })()}

                {tipoVideo === 'arquivo' && (
                  <div>
                    <input ref={videoFileRef} type="file" accept="video/*" style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadVideo(f); e.target.value = '' }} />
                    {!videoUrl ? (
                      <button type="button" onClick={() => videoFileRef.current?.click()} disabled={uploadandoVideo}
                        style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: uploadandoVideo ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
                        {uploadandoVideo ? `⏳ Enviando ${progressoVideo}%...` : '📁 Selecionar vídeo'}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#02A15320', border: '1px solid var(--avp-green)', borderRadius: 8, padding: '10px 14px' }}>
                        <span style={{ fontSize: 13, color: 'var(--avp-green)', flex: 1 }}>✅ Vídeo enviado com sucesso</span>
                        <button type="button" onClick={() => setVideoUrl('')} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 12 }}>Remover</button>
                      </div>
                    )}
                    {uploadandoVideo && (
                      <div style={{ marginTop: 8, background: 'var(--avp-border)', borderRadius: 4, height: 4 }}>
                        <div style={{ background: 'var(--avp-blue)', width: `${progressoVideo}%`, height: '100%', borderRadius: 4, transition: 'width 0.2s' }} />
                      </div>
                    )}
                  </div>
                )}

                {tipoVideo === 'url' && (
                  <input style={inputStyle} placeholder="URL do vídeo (Vimeo, MP4 direto...)" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
                )}
              </div>

              {/* Aula ao vivo */}
              <div style={{ borderTop: '1px solid var(--avp-border)', paddingTop: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: aoVivo ? 16 : 0 }}>
                  <input type="checkbox" checked={aoVivo} onChange={e => setAoVivo(e.target.checked)} style={{ width: 16, height: 16 }} />
                  <span style={{ color: 'var(--avp-text)', fontWeight: 600 }}>Esta aula é ao vivo</span>
                </label>
                {aoVivo && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Link da reunião</label><input style={inputStyle} value={form.ao_vivo_link} onChange={e => setForm(p => ({ ...p, ao_vivo_link: e.target.value }))} placeholder="https://zoom.us/..." /></div>
                    <div><label style={labelStyle}>Data e hora</label><input type="datetime-local" style={inputStyle} value={form.ao_vivo_data} onChange={e => setForm(p => ({ ...p, ao_vivo_data: e.target.value }))} /></div>
                    <div><label style={labelStyle}>Plataforma</label>
                      <select style={inputStyle} value={form.ao_vivo_plataforma} onChange={e => setForm(p => ({ ...p, ao_vivo_plataforma: e.target.value }))}>
                        <option value="zoom">Zoom</option><option value="meet">Google Meet</option><option value="teams">Microsoft Teams</option><option value="outro">Outro</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Coluna direita: configurações + capa ── */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18, background: 'rgba(0,0,0,0.15)' }}>
              {/* Capa da aula */}
              <div>
                <label style={labelStyle}>Imagem da aula</label>
                <div onClick={() => capaFileRef.current?.click()} style={{ borderRadius: 8, overflow: 'hidden', border: `2px dashed ${capaPreview ? 'var(--avp-green)' : 'var(--avp-border)'}`, background: 'var(--avp-black)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '320/480', marginBottom: 8 }}>
                  {capaPreview ? <img src={capaPreview} alt="capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'var(--avp-text-dim)', fontSize: 28 }}>🖼️</span>}
                </div>
                <input ref={capaFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) selecionarCapa(f); e.target.value = '' }} />
                <button type="button" onClick={() => capaFileRef.current?.click()} disabled={uploadandoCapa}
                  style={{ width: '100%', background: capaPreview ? 'var(--avp-green)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: uploadandoCapa ? 0.7 : 1 }}>
                  {uploadandoCapa ? '⏳ Lendo...' : capaPreview ? '🔄 Trocar imagem' : '📤 Subir imagem'}
                </button>
                <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', textAlign: 'center', marginTop: 6 }}>Tamanho recomendado: 320×480 px</p>
              </div>

              <div style={{ borderTop: '1px solid var(--avp-border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', textTransform: 'uppercase' as const, letterSpacing: 1 }}>Configurações</p>
                <div>
                  <label style={labelStyle}>Liberação da próxima aula</label>
                  {(['automatico', 'manual_gestor', 'manual_admin'] as const).map(modo => (
                    <label key={modo} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', marginBottom: 8, padding: '8px 10px', borderRadius: 8, border: `1px solid ${form.liberacao_modo === modo ? 'var(--avp-blue)' : 'var(--avp-border)'}`, background: form.liberacao_modo === modo ? '#33368715' : 'transparent' }}>
                      <input type="radio" name="liberacao_modo_new" checked={form.liberacao_modo === modo} onChange={() => setForm(p => ({ ...p, liberacao_modo: modo }))} style={{ marginTop: 2, accentColor: 'var(--avp-blue)' }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--avp-text)', margin: 0 }}>
                          {modo === 'automatico' ? '⚡ Automático' : modo === 'manual_gestor' ? '👤 Aprovação do Gestor' : '🛡 Aprovação do Admin'}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>
                          {modo === 'automatico' ? 'Libera sozinho após o tempo configurado' : modo === 'manual_gestor' ? 'Gestor precisa clicar para liberar' : 'Só o admin da empresa pode liberar'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                <div><label style={labelStyle}>Espera após aprovação (h) {form.liberacao_modo !== 'automatico' ? <span style={{ color: 'var(--avp-text-dim)', fontWeight: 400 }}>(após liberação manual)</span> : ''}</label><input type="number" style={inputStyle} value={form.espera_horas} onChange={e => setForm(p => ({ ...p, espera_horas: parseInt(e.target.value) || 0 }))} /></div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ ...labelStyle, marginBottom: 8 }}>🎬 Controle do vídeo</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, border: `1px solid ${(form as any).bloquear_avancar ? 'var(--avp-danger)' : 'var(--avp-border)'}`, background: (form as any).bloquear_avancar ? '#e6394610' : 'transparent' }}>
                    <input type="checkbox" checked={!!(form as any).bloquear_avancar} onChange={e => setForm(p => ({ ...p, bloquear_avancar: e.target.checked } as typeof p))} style={{ width: 16, height: 16, accentColor: 'var(--avp-danger)' }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>🚫 Bloquear avanço do vídeo</p>
                      <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>Aluno não pode pular para frente — precisa assistir na ordem</p>
                    </div>
                  </label>
                </div>
                <div><label style={labelStyle}>Duração (min)</label><input type="number" style={inputStyle} value={form.duracao_minutos} onChange={e => setForm(p => ({ ...p, duracao_minutos: e.target.value }))} placeholder="Ex: 12" /></div>
                <div><label style={labelStyle}>Qtd. de questões no quiz</label><input type="number" style={inputStyle} value={form.quiz_qtd_questoes} onChange={e => setForm(p => ({ ...p, quiz_qtd_questoes: parseInt(e.target.value) }))} min={1} max={20} /></div>
                <div><label style={labelStyle}>Aprovação mínima (%)</label><input type="number" style={inputStyle} value={form.quiz_aprovacao_minima} onChange={e => setForm(p => ({ ...p, quiz_aprovacao_minima: parseInt(e.target.value) }))} min={50} max={100} /></div>
                <div><label style={labelStyle}>Validade (meses)</label><input type="number" style={inputStyle} value={form.validade_meses} onChange={e => setForm(p => ({ ...p, validade_meses: e.target.value }))} min={0} placeholder="0 = sem validade" /></div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Tipo do quiz</label>
                  {(['obrigatorio', 'indicativo'] as const).map(tipo => (
                    <label key={tipo} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', marginBottom: 8, padding: '8px 10px', borderRadius: 8, border: `1px solid ${form.quiz_tipo === tipo ? 'var(--avp-green)' : 'var(--avp-border)'}`, background: form.quiz_tipo === tipo ? '#02A15315' : 'transparent' }}>
                      <input type="radio" checked={form.quiz_tipo === tipo} onChange={() => setForm(p => ({ ...p, quiz_tipo: tipo }))} style={{ marginTop: 2, accentColor: 'var(--avp-green)' }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--avp-text)', margin: 0 }}>
                          {tipo === 'obrigatorio' ? '🔒 Obrigatório' : '💡 Indicativo'}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>
                          {tipo === 'obrigatorio' ? 'Aluno deve passar no quiz para desbloquear a próxima aula' : 'Aluno pode pular o quiz — serve como indicador de participação'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                <div style={{ gridColumn: '1 / -1', background: '#3b82f615', border: '1px solid #3b82f640', borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: '#60a5fa', marginBottom: 4 }}>As perguntas do quiz são adicionadas depois de salvar</p>
                    <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', lineHeight: 1.6 }}>
                      Aqui você define <strong style={{ color: 'var(--avp-text)' }}>quantas perguntas</strong> aparecem no quiz e a <strong style={{ color: 'var(--avp-text)' }}>nota mínima</strong> para aprovação. Após salvar a aula, aparecerá um botão <strong style={{ color: 'var(--avp-text)' }}>"Clique aqui para adicionar as perguntas"</strong> onde você escreve cada pergunta com as alternativas e marca a resposta correta.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[...aulas].sort((a, b) => a.ordem - b.ordem).map((aula, aulaIdx) => {
          const isEditing = editandoId === aula.id
          const temCapa = aula.capa_url?.startsWith('data:') || aula.capa_url?.startsWith('blob:')
          return (
            <div key={aula.id}
              draggable={!isEditing}
              onDragStart={() => { dragAulaIndex.current = aulaIdx }}
              onDragEnter={() => setDragAulaOver(aulaIdx)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => onDropAula(aulaIdx)}
              onDragEnd={() => setDragAulaOver(null)}
              style={{
                ...cardStyle,
                border: `1px solid ${dragAulaOver === aulaIdx ? 'var(--avp-blue)' : 'var(--avp-border)'}`,
                boxShadow: dragAulaOver === aulaIdx ? '0 0 0 2px rgba(59,130,246,0.3)' : 'none',
                opacity: dragAulaIndex.current === aulaIdx ? 0.4 : 1,
                cursor: isEditing ? 'default' : 'grab',
                transition: 'border-color 0.15s, opacity 0.15s',
              }}>
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--avp-text-dim)' }}>Editando Aula #{aula.ordem}</p>
                    <button onClick={() => setEditandoId(null)} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 20 }}>×</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Título *</label><input style={inputStyle} value={editForm.titulo} onChange={e => setEditForm(p => ({ ...p, titulo: e.target.value }))} /></div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Vídeo</label>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                        {(['youtube', 'arquivo', 'url'] as const).map(t => (
                          <button key={t} type="button" onClick={() => { setEditTipoVideo(t); setEditVideoUrl('') }}
                            style={{ padding: '5px 14px', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: editTipoVideo === t ? 'var(--avp-blue)' : 'transparent', borderColor: editTipoVideo === t ? 'var(--avp-blue)' : 'var(--avp-border)', color: editTipoVideo === t ? '#fff' : 'var(--avp-text-dim)' }}>
                            {t === 'youtube' ? '▶ YouTube' : t === 'arquivo' ? '📁 Arquivo' : '🔗 URL / Vimeo'}
                          </button>
                        ))}
                      </div>
                      {editTipoVideo === 'youtube' && (() => {
                        const ytId = extrairIdYoutube(editForm.youtube_url)
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <input style={inputStyle} placeholder="Youtube URL (ex: https://www.youtube.com/watch?v=...)" value={editForm.youtube_url} onChange={e => setEditForm(p => ({ ...p, youtube_url: e.target.value }))} />
                            {ytId && (
                              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 8, overflow: 'hidden', background: '#000' }}>
                                <iframe src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`} allowFullScreen style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} />
                              </div>
                            )}
                          </div>
                        )
                      })()}
                      {editTipoVideo === 'arquivo' && (
                        <div>
                          <input ref={editVideoFileRef} type="file" accept="video/*" style={{ display: 'none' }}
                            onChange={e => { const f = e.target.files?.[0]; if (f) uploadVideoEdit(f); e.target.value = '' }} />
                          {!editVideoUrl ? (
                            <button type="button" onClick={() => editVideoFileRef.current?.click()} disabled={editUploadandoVideo}
                              style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', cursor: editUploadandoVideo ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600 }}>
                              {editUploadandoVideo ? `⏳ Enviando ${editProgressoVideo}%...` : '📁 Selecionar vídeo'}
                            </button>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#02A15320', border: '1px solid var(--avp-green)', borderRadius: 8, padding: '9px 12px' }}>
                              <span style={{ fontSize: 12, color: 'var(--avp-green)', flex: 1 }}>✅ Vídeo pronto</span>
                              <button type="button" onClick={() => setEditVideoUrl('')} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 11 }}>Remover</button>
                            </div>
                          )}
                          {editUploadandoVideo && (
                            <div style={{ marginTop: 6, background: 'var(--avp-border)', borderRadius: 4, height: 4 }}>
                              <div style={{ background: 'var(--avp-blue)', width: `${editProgressoVideo}%`, height: '100%', borderRadius: 4, transition: 'width 0.2s' }} />
                            </div>
                          )}
                        </div>
                      )}
                      {editTipoVideo === 'url' && (
                        <input style={inputStyle} placeholder="URL do vídeo (Vimeo, MP4 direto...)" value={editVideoUrl} onChange={e => setEditVideoUrl(e.target.value)} />
                      )}
                    </div>
                    <div><label style={labelStyle}>Duração (min)</label><input type="number" style={inputStyle} value={editForm.duracao_minutos} onChange={e => setEditForm(p => ({ ...p, duracao_minutos: e.target.value }))} /></div>
                    <div><label style={labelStyle}>Espera após aprovação (horas)</label><input type="number" style={inputStyle} value={editForm.espera_horas} onChange={e => setEditForm(p => ({ ...p, espera_horas: parseInt(e.target.value) }))} /></div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ ...labelStyle, marginBottom: 8 }}>🎬 Controle do vídeo</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, border: `1px solid ${(editForm as any).bloquear_avancar ? 'var(--avp-danger)' : 'var(--avp-border)'}`, background: (editForm as any).bloquear_avancar ? '#e6394610' : 'transparent' }}>
                        <input type="checkbox" checked={!!(editForm as any).bloquear_avancar} onChange={e => setEditForm(p => ({ ...p, bloquear_avancar: e.target.checked } as typeof p))} style={{ width: 16, height: 16, accentColor: 'var(--avp-danger)' }} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>🚫 Bloquear avanço do vídeo</p>
                          <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>Aluno não pode pular para frente — precisa assistir na ordem</p>
                        </div>
                      </label>
                    </div>
                    <div><label style={labelStyle}>Qtd. de questões no quiz</label><input type="number" style={inputStyle} value={editForm.quiz_qtd_questoes} onChange={e => setEditForm(p => ({ ...p, quiz_qtd_questoes: parseInt(e.target.value) }))} min={1} max={20} /></div>
                    <div><label style={labelStyle}>Aprovação mínima (%)</label><input type="number" style={inputStyle} value={editForm.quiz_aprovacao_minima} onChange={e => setEditForm(p => ({ ...p, quiz_aprovacao_minima: parseInt(e.target.value) }))} min={50} max={100} /></div>
                    <div><label style={labelStyle}>Validade (meses)</label><input type="number" style={inputStyle} value={editForm.validade_meses} onChange={e => setEditForm(p => ({ ...p, validade_meses: e.target.value }))} min={0} placeholder="0 = sem validade" /></div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Tipo do quiz</label>
                      {(['obrigatorio', 'indicativo'] as const).map(tipo => (
                        <label key={tipo} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', marginBottom: 8, padding: '8px 10px', borderRadius: 8, border: `1px solid ${editForm.quiz_tipo === tipo ? 'var(--avp-green)' : 'var(--avp-border)'}`, background: editForm.quiz_tipo === tipo ? '#02A15315' : 'transparent' }}>
                          <input type="radio" checked={editForm.quiz_tipo === tipo} onChange={() => setEditForm(p => ({ ...p, quiz_tipo: tipo }))} style={{ marginTop: 2, accentColor: 'var(--avp-green)' }} />
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--avp-text)', margin: 0 }}>
                              {tipo === 'obrigatorio' ? '🔒 Obrigatório' : '💡 Indicativo'}
                            </p>
                            <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>
                              {tipo === 'obrigatorio' ? 'Aluno deve passar no quiz para desbloquear a próxima aula' : 'Aluno pode pular o quiz — serve como indicador de participação'}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div style={{ gridColumn: '1 / -1', background: '#3b82f615', border: '1px solid #3b82f640', borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
                      <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', lineHeight: 1.6 }}>
                        As perguntas do quiz são editadas <strong style={{ color: '#60a5fa' }}>abaixo desta seção</strong>, no botão <strong style={{ color: 'var(--avp-text)' }}>"Clique aqui para adicionar as perguntas"</strong>. Cancele a edição para ver o botão.
                      </p>
                    </div>
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
                      <span style={{ fontSize: 18, color: 'var(--avp-text-dim)', cursor: 'grab', flexShrink: 0, marginTop: 2 }} title="Arraste para reordenar">⠿</span>
                      {temCapa && <img src={aula.capa_url!} alt={aula.titulo} style={{ width: 72, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <span style={{ background: 'var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>#{aula.ordem}</span>
                          <h3 style={{ fontWeight: 700, fontSize: 15 }}>{aula.titulo}</h3>
                          {aula.ao_vivo_link && <span style={{ background: '#33368720', color: '#6366f1', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>AO VIVO</span>}
                          {aula.validade_meses && <span style={{ background: '#f59e0b20', color: '#f59e0b', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>Validade: {aula.validade_meses}m</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 16, color: 'var(--avp-text-dim)', fontSize: 13 }}>
                          {aula.youtube_video_id
                            ? <span>▶ YouTube: {aula.youtube_video_id}</span>
                            : aula.video_url
                              ? <span style={{ color: 'var(--avp-green)' }}>📁 {aula.video_url.includes('vimeo') ? 'Vimeo' : 'Arquivo de vídeo'}</span>
                              : <span style={{ color: 'var(--avp-danger)' }}>Sem vídeo</span>
                          }
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
                  <QuestoesAula
                    aulaId={aula.id}
                    aprovacaoMinima={aula.quiz_aprovacao_minima}
                    quizTipoInicial={aula.quiz_tipo ?? 'obrigatorio'}
                    quizSimNaoPerguntaInicial={aula.quiz_sim_nao_pergunta ?? ''}
                    quizSimNaoNaoMensagemInicial={aula.quiz_sim_nao_nao_mensagem ?? ''}
                    quizSimNaoPerguntasInicial={aula.quiz_sim_nao_perguntas ?? undefined}
                  />
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
