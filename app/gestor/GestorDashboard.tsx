'use client'
import { useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import GestorLayout from './GestorLayout'
import LiberacoesPendentes from './LiberacoesPendentes'
import WhatsAppConectar from '@/app/components/WhatsAppConectar'
import PhoneInput from '@/app/components/PhoneInput'
import EventosWidget from '@/app/components/EventosWidget'
import MuralNoticias from '@/app/components/MuralNoticias'
import ImageCropModal from '@/app/components/ImageCropModal'
import GestorArtesTemplates from './artes/GestorArtesTemplates'

// ── Componente de Perfil do Gestor ──────────────────────────────────────────
function PerfilGestor({ gestor, onNomeAtualizado }: { gestor: Gestor; onNomeAtualizado: (n: string) => void }) {
  const [nome, setNome]         = useState(gestor.nome)
  const [fotoUrl, setFotoUrl]   = useState<string | null>(gestor.foto_perfil ?? null)
  const [cropSrc, setCropSrc]   = useState<string | null>(null)
  const [showCrop, setShowCrop] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg]           = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
  const fotoRef = useRef<HTMLInputElement>(null)

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
    const fd = new FormData()
    fd.append('foto', blob, 'foto.jpg')
    const res = await fetch('/api/gestor/foto-perfil', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) setFotoUrl(data.url)
    setMsg({ tipo: data.url ? 'ok' : 'err', texto: data.url ? 'Foto atualizada!' : 'Erro ao salvar foto.' })
    setTimeout(() => setMsg(null), 3000)
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    const res = await fetch('/api/gestor/perfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome }),
    })
    const data = await res.json()
    if (data.ok) { setMsg({ tipo: 'ok', texto: 'Perfil atualizado!' }); onNomeAtualizado(nome) }
    else setMsg({ tipo: 'err', texto: data.error ?? 'Erro ao salvar.' })
    setSalvando(false)
    setTimeout(() => setMsg(null), 4000)
  }

  const inp: React.CSSProperties = { width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '11px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'Inter, sans-serif' }

  return (
    <>
      {showCrop && cropSrc && (
        <ImageCropModal src={cropSrc} circular title="Ajustar foto de perfil" onSave={handleCropSave} onCancel={() => setShowCrop(false)} />
      )}
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Meu Perfil</h1>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Edite seus dados e foto de perfil</p>
        </div>

        {msg && (
          <div style={{ padding: '12px 16px', background: msg.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 10, color: msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 14, marginBottom: 20 }}>
            {msg.texto}
          </div>
        )}

        {/* Foto */}
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: '24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div onClick={() => fotoRef.current?.click()}
              style={{ width: 96, height: 96, borderRadius: '50%', overflow: 'hidden', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '3px solid var(--avp-border)' }}>
              {fotoUrl
                ? <img src={fotoUrl} alt={nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>{nome.charAt(0).toUpperCase()}</span>}
            </div>
            <button onClick={() => fotoRef.current?.click()}
              style={{ position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: '50%', background: 'var(--avp-green)', border: '2px solid var(--avp-black)', color: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              📷
            </button>
            <input ref={fotoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFotoChange} />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 4px' }}>{gestor.nome}</p>
            <p style={{ color: '#818cf8', fontSize: 13, margin: '0 0 10px', fontWeight: 700 }}>✨ UNIAVP PRO</p>
            <button onClick={() => fotoRef.current?.click()}
              style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              📷 Trocar foto
            </button>
          </div>
        </div>

        {/* Dados */}
        <form onSubmit={salvar} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--avp-border)' }}>
            <h2 style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>Dados cadastrais</h2>
          </div>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>Nome *</label>
              <input style={inp} value={nome} onChange={e => setNome(e.target.value)} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>WhatsApp</label>
                <input style={{ ...inp, opacity: 0.6, cursor: 'not-allowed' }} value={gestor.whatsapp} readOnly />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>E-mail</label>
                <input style={{ ...inp, opacity: 0.6, cursor: 'not-allowed' }} value={gestor.email} readOnly />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid var(--avp-border)' }}>
              <button type="submit" disabled={salvando}
                style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 28px', fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: salvando ? 0.7 : 1 }}>
                {salvando ? 'Salvando...' : '✓ Salvar'}
              </button>
            </div>
          </div>
        </form>

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
    </>
  )
}

type Consultor = {
  id: string; nome: string; whatsapp: string; email: string; status: string; created_at: string
  ultimo_estudo_em?: string | null; streak_atual?: number | null
}
type Modulo = {
  titulo: string; ordem: number; aulas_total: number; aulas_concluidas: number; percentual: number
}
type Evento = { id: string; titulo: string; descricao: string; cidade: string; data_hora: string }
type Gestor = { id: string; nome: string; email: string; whatsapp: string; foto_perfil?: string | null }

const badgeStatus: Record<string, { label: string; color: string; bg: string }> = {
  ativo: { label: 'Ativo', color: 'var(--avp-green)', bg: '#02A15320' },
  concluido: { label: 'Concluído', color: '#333687', bg: '#33368720' },
  pausado: { label: 'Pausado', color: '#f59e0b', bg: '#f59e0b20' },
  desligado: { label: 'Desligado', color: 'var(--avp-danger)', bg: '#e6394620' },
}

function BarraProgresso({ pct }: { pct: number }) {
  const cor = pct === 100 ? 'var(--avp-green)' : pct > 0 ? 'var(--avp-blue)' : 'var(--avp-border)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, background: 'var(--avp-border)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: cor, height: '100%', borderRadius: 100, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--avp-text-dim)', minWidth: 32 }}>{pct}%</span>
    </div>
  )
}

type ArteTemplate = { id: string; tipo: string; titulo: string; arte_url: string; foto_x: number; foto_y: number; foto_largura: number; foto_altura: number; foto_redondo: boolean; ativo: boolean; formato: string; gestor_id: string | null; texto_ativo?: boolean; texto_template?: string; texto_x?: number; texto_y?: number; texto_tamanho?: number; texto_cor?: string; texto_negrito?: boolean; texto_alinhamento?: string; texto_sombra?: boolean }

const LIMITE_PRO_GRATUITO = 20

function NavAulas({ aulas, aulaAtualId, onPrev, onNext }: { aulas: any[]; aulaAtualId: string; onPrev: (a: any) => void; onNext: (a: any) => void }) {
  const idx = aulas.findIndex(a => a.id === aulaAtualId)
  const prev = idx > 0 ? aulas[idx - 1] : null
  const next = idx < aulas.length - 1 ? aulas[idx + 1] : null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, paddingTop: 10, borderTop: '1px solid var(--avp-border)' }}>
      <button onClick={() => prev && onPrev(prev)} disabled={!prev}
        style={{ flex: 1, background: 'var(--avp-black)', border: '1px solid var(--avp-border)', color: prev ? 'var(--avp-text)' : 'var(--avp-text-dim)', borderRadius: 8, padding: '9px 14px', cursor: prev ? 'pointer' : 'default', fontSize: 13, fontWeight: 600, opacity: prev ? 1 : 0.4 }}>
        ← Aula anterior
      </button>
      <button onClick={() => next && onNext(next)} disabled={!next}
        style={{ flex: 1, background: next ? 'var(--avp-blue)' : 'var(--avp-black)', border: `1px solid ${next ? 'var(--avp-blue)' : 'var(--avp-border)'}`, color: '#fff', borderRadius: 8, padding: '9px 14px', cursor: next ? 'pointer' : 'default', fontSize: 13, fontWeight: 600, opacity: next ? 1 : 0.4 }}>
        Próxima aula →
      </button>
    </div>
  )
}

function AvisoAulasNaoPublicadas({ modulosAulas }: { modulosAulas: any[] }) {
  const naoPublicadas = modulosAulas.flatMap(m => m.aulas).filter(a => !a.publicado).length
  const totalAulas = modulosAulas.flatMap(m => m.aulas).length
  if (naoPublicadas === 0 || totalAulas === 0) return null
  return (
    <div style={{ background: '#f59e0b15', border: '1px solid #f59e0b40', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 18 }}>⚠️</span>
      <div>
        <p style={{ fontWeight: 700, color: '#f59e0b', fontSize: 14, margin: '0 0 2px' }}>
          {naoPublicadas} aula{naoPublicadas !== 1 ? 's' : ''} não publicada{naoPublicadas !== 1 ? 's' : ''}
        </p>
        <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0 }}>
          Aulas em rascunho não aparecem para os consultores. Publique em <strong style={{ color: 'var(--avp-text)' }}>Admin → Módulos → editar aula → ✅ Publicado</strong>.
        </p>
      </div>
    </div>
  )
}

function CardProGratuito({ prosIndicados }: { prosIndicados: number }) {
  const pct = Math.min(100, Math.round((prosIndicados / LIMITE_PRO_GRATUITO) * 100))
  const ehGratuito = prosIndicados >= LIMITE_PRO_GRATUITO
  return (
    <div style={{ background: ehGratuito ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))' : 'var(--avp-card)', border: `1px solid ${ehGratuito ? 'rgba(99,102,241,0.5)' : 'var(--avp-border)'}`, borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: 15, margin: 0 }}>{ehGratuito ? '🎉 Seu PRO está gratuito!' : '✨ PRO gratuito por rede'}</p>
          <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '3px 0 0' }}>
            {ehGratuito ? `Você tem ${prosIndicados} PROs ativos na sua rede — continue assim!` : `Indique ${LIMITE_PRO_GRATUITO - prosIndicados} PROs ativos para ter o plano gratuito`}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 28, fontWeight: 900, color: ehGratuito ? '#818cf8' : 'var(--avp-text)', margin: 0, lineHeight: 1 }}>
            {prosIndicados}<span style={{ fontSize: 14, fontWeight: 600, color: 'var(--avp-text-dim)' }}>/{LIMITE_PRO_GRATUITO}</span>
          </p>
          <p style={{ fontSize: 10, color: 'var(--avp-text-dim)', margin: '2px 0 0', textTransform: 'uppercase' as const, letterSpacing: 1 }}>PROs ativos</p>
        </div>
      </div>
      <div style={{ background: 'var(--avp-border)', borderRadius: 100, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: ehGratuito ? 'linear-gradient(90deg, #6366f1, #8b5cf6)' : pct >= 75 ? 'linear-gradient(90deg, #f59e0b, #6366f1)' : 'linear-gradient(90deg, #3b82f6, #6366f1)', borderRadius: 100, transition: 'width 0.4s' }} />
      </div>
      {!ehGratuito && (
        <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 6 }}>
          Faltam <strong style={{ color: 'var(--avp-text)' }}>{LIMITE_PRO_GRATUITO - prosIndicados} PROs</strong> para o plano gratuito — compartilhe o link PRO com sua rede!
        </p>
      )}
    </div>
  )
}

export default function GestorDashboard({
  gestor, consultores, progressoMap, indicacoesMap, artesTemplatesIniciais, baseUrl, capaDefault, prosIndicados,
}: {
  gestor: Gestor; consultores: Consultor[]; progressoMap: Record<string, number>; indicacoesMap: Record<string, number>; artesTemplatesIniciais: ArteTemplate[]; baseUrl: string; capaDefault?: string | null; prosIndicados?: number
}) {
  const [aba, setAba] = useState('dashboard')
  const [listaConsultores, setListaConsultores] = useState(consultores)
  const [consultorSelecionado, setConsultorSelecionado] = useState<Consultor | null>(null)
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [carregandoModulos, setCarregandoModulos] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [showNovoConsultor, setShowNovoConsultor] = useState(false)
  const [novoForm, setNovoForm] = useState({ nome: '', whatsapp: '', email: '', senha: '' })
  const [salvandoConsultor, setSalvandoConsultor] = useState(false)
  const [msgConsultor, setMsgConsultor] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
  const [verSenhaNovo, setVerSenhaNovo] = useState(false)
  const [eventos, setEventos] = useState<Evento[]>([])
  const [eventosCarregados, setEventosCarregados] = useState(false)
  type AulaGestor = { id: string; titulo: string; descricao: string | null; youtube_video_id: string | null; video_url: string | null; duracao_minutos: number | null; capa_url: string | null; ordem: number; modulo_id: string; publicado: boolean; quiz_aprovacao_minima?: number | null; quiz_qtd_questoes?: number | null; quiz_tipo?: string | null; espera_horas?: number | null; liberacao_modo?: string | null }
  const [modulosAulas, setModulosAulas] = useState<{ id: string; titulo: string; ordem: number; capa_url?: string | null; aulas: AulaGestor[] }[]>([])
  const [aulasCarregadas, setAulasCarregadas] = useState(false)
  const [aulaAberta, setAulaAberta] = useState<AulaGestor | null>(null)
  const [moduloAberto, setModuloAberto] = useState<{ id: string; titulo: string; ordem: number; capa_url?: string | null; aulas: AulaGestor[] } | null>(null)
  const [eventoForm, setEventoForm] = useState({ titulo: '', descricao: '', cidade: '', data_hora: '', notificar: true })
  const [salvandoEvento, setSalvandoEvento] = useState(false)
  const [showEvento, setShowEvento] = useState(false)
  const [msgEvento, setMsgEvento] = useState('')
  const [artesSubAba, setArtesSubAba] = useState<'templates' | 'consultores'>('consultores')
  const [artesTemplates] = useState<ArteTemplate[]>(artesTemplatesIniciais)

  const ativos = listaConsultores.filter(c => c.status !== 'concluido')
  const emAndamento = listaConsultores.filter(c => c.status === 'ativo' && progressoMap[c.id] > 0).length
  const concluidos = listaConsultores.filter(c => c.status === 'concluido').length
  const totalAtivos = ativos.length

  const seteAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const inativos7d = listaConsultores.filter(c =>
    c.status === 'ativo' &&
    (!c.ultimo_estudo_em || new Date(c.ultimo_estudo_em) < seteAtras)
  )
  const progressoVals = listaConsultores.map(c => progressoMap[c.id] ?? 0)
  const mediaProgresso = progressoVals.length > 0
    ? Math.round(progressoVals.reduce((s, v) => s + v, 0) / progressoVals.length)
    : 0

  function copiarLink() {
    navigator.clipboard.writeText(`${baseUrl}/g/${gestor.whatsapp}`)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  async function cadastrarConsultor(e: React.FormEvent) {
    e.preventDefault()
    setSalvandoConsultor(true)
    setMsgConsultor(null)
    const res = await fetch('/api/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: novoForm.nome,
        whatsapp: novoForm.whatsapp.replace(/\D/g, ''),
        email: novoForm.email,
        senha: novoForm.senha,
        gestor_nome: gestor.nome,
        gestor_whatsapp: gestor.whatsapp,
      }),
    })
    const data = await res.json()
    if (data.ok || data.aluno) {
      setMsgConsultor({ tipo: 'ok', texto: `Consultor "${novoForm.nome}" cadastrado com sucesso!` })
      if (data.aluno) {
        setListaConsultores(prev => [data.aluno, ...prev])
      }
      setNovoForm({ nome: '', whatsapp: '', email: '', senha: '' })
      setTimeout(() => { setShowNovoConsultor(false); setMsgConsultor(null) }, 2500)
    } else {
      setMsgConsultor({ tipo: 'err', texto: data.erro ?? data.error ?? 'Erro ao cadastrar.' })
    }
    setSalvandoConsultor(false)
  }

  async function removerConsultor(c: Consultor) {
    if (!confirm(`Remover ${c.nome} da sua equipe?`)) return
    const res = await fetch('/api/gestor/consultor', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alunoId: c.id }),
    })
    if (res.ok) setListaConsultores(prev => prev.filter(x => x.id !== c.id))
  }

  async function alterarStatus(c: Consultor, novoStatus: 'ativo' | 'pausado') {
    const res = await fetch('/api/gestor/consultor', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alunoId: c.id, status: novoStatus }),
    })
    if (res.ok) setListaConsultores(prev => prev.map(x => x.id === c.id ? { ...x, status: novoStatus } : x))
  }

  function diasSemEstudar(c: Consultor): number | null {
    if (!c.ultimo_estudo_em) return null
    return Math.floor((Date.now() - new Date(c.ultimo_estudo_em).getTime()) / (1000 * 60 * 60 * 24))
  }

  async function abrirConsultor(c: Consultor) {
    setConsultorSelecionado(c)
    setCarregandoModulos(true)
    setModulos([])
    try {
      const res = await fetch(`/api/gestor/consultor-progresso?alunoId=${c.id}`)
      const data = await res.json()
      setModulos(data.modulos ?? [])
    } catch { setModulos([]) }
    setCarregandoModulos(false)
  }

  async function carregarEventos() {
    if (eventosCarregados) return
    const res = await fetch('/api/gestor/eventos')
    setEventos(await res.json())
    setEventosCarregados(true)
  }

  async function carregarAulas() {
    if (aulasCarregadas) return
    const res = await fetch('/api/gestor/aulas')
    const data = await res.json()
    const mods = (data.modulos ?? []) as { id: string; titulo: string; ordem: number; capa_url?: string | null }[]
    const auls = (data.aulas ?? []) as AulaGestor[]
    const agrupado = mods.map(m => ({
      ...m,
      aulas: auls.filter(a => a.modulo_id === m.id).sort((a, b) => a.ordem - b.ordem),
    }))
    setModulosAulas(agrupado)
    setAulasCarregadas(true)
  }

  async function salvarEvento(e: React.FormEvent) {
    e.preventDefault()
    setSalvandoEvento(true)
    const res = await fetch('/api/gestor/eventos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventoForm),
    })
    const data = await res.json()
    if (data.id) {
      setEventos(prev => [...prev, data])
      setEventoForm({ titulo: '', descricao: '', cidade: '', data_hora: '', notificar: true })
      setShowEvento(false)
      setMsgEvento('Evento criado!')
    } else {
      setMsgEvento('Erro ao criar evento.')
    }
    setSalvandoEvento(false)
    setTimeout(() => setMsgEvento(''), 3000)
  }

  async function removerEvento(id: string) {
    if (!confirm('Excluir este evento?')) return
    await fetch('/api/gestor/eventos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setEventos(prev => prev.filter(ev => ev.id !== id))
  }

  function handleSetAba(id: string) {
    setAba(id)
    if (id === 'eventos') carregarEventos()
    if (id === 'aulas') carregarAulas()
  }

  const inp: React.CSSProperties = { width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }

  return (
    <>
    {/* Modal Novo Consultor */}
    {showNovoConsultor && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}
        onClick={e => e.target === e.currentTarget && setShowNovoConsultor(false)}>
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 20, width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto' }}
          onMouseDown={e => e.stopPropagation()}>
          <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--avp-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Novo UNIAVP FREE</h2>
            <button onClick={() => setShowNovoConsultor(false)} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 24 }}>×</button>
          </div>
          <div style={{ padding: 28 }}>
            {/* Aba link ou cadastro manual */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <div style={{ flex: 1, background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '14px 16px' }}>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>🔗 Link de cadastro</p>
                <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginBottom: 4, lineHeight: 1.5 }}>Envie este link para o consultor se cadastrar sozinho</p>
                <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', background: 'var(--avp-card)', borderRadius: 6, padding: '6px 8px', marginBottom: 10, wordBreak: 'break-all' as const, fontFamily: 'monospace' }}>{baseUrl}/g/{gestor.whatsapp}</p>
                <button onClick={() => { copiarLink(); }}
                  style={{ width: '100%', background: linkCopiado ? 'var(--avp-green)' : 'var(--avp-border)', color: linkCopiado ? '#fff' : 'var(--avp-text)', border: 'none', borderRadius: 8, padding: '9px', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {linkCopiado ? '✓ Link copiado!' : '📋 Copiar link'}
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--avp-border)', paddingTop: 20, marginBottom: 4 }}>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>✍️ Cadastrar manualmente</p>
            </div>

            {msgConsultor && (
              <div style={{ padding: '10px 14px', background: msgConsultor.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msgConsultor.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msgConsultor.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 13, marginBottom: 16 }}>
                {msgConsultor.texto}
              </div>
            )}

            <form onSubmit={cadastrarConsultor} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Nome completo *</label>
                <input type="text" placeholder="Nome do consultor" value={novoForm.nome} onChange={e => setNovoForm(p => ({ ...p, nome: e.target.value }))} required style={inp} />
              </div>
              <div>
                <label style={lbl}>WhatsApp *</label>
                <PhoneInput value={novoForm.whatsapp} onChange={v => setNovoForm(p => ({ ...p, whatsapp: v }))} required />
              </div>
              <div>
                <label style={lbl}>E-mail *</label>
                <input type="email" placeholder="email@consultor.com" value={novoForm.email} onChange={e => setNovoForm(p => ({ ...p, email: e.target.value }))} required style={inp} />
              </div>
              <div>
                <label style={lbl}>Senha inicial *</label>
                <div style={{ position: 'relative' }}>
                  <input type={verSenhaNovo ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={novoForm.senha} onChange={e => setNovoForm(p => ({ ...p, senha: e.target.value }))} required minLength={6} style={{ ...inp, paddingRight: 44 }} />
                  <button type="button" onClick={() => setVerSenhaNovo(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', display: 'flex' }}>
                    {verSenhaNovo
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowNovoConsultor(false)}
                  style={{ flex: 1, background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 10, padding: '12px', cursor: 'pointer', fontSize: 14 }}>
                  Cancelar
                </button>
                <button type="submit" disabled={salvandoConsultor}
                  style={{ flex: 2, background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: salvandoConsultor ? 0.7 : 1 }}>
                  {salvandoConsultor ? 'Cadastrando...' : '+ Cadastrar FREE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}

    {/* ── MODAL PLAYER AULA (gestor) ── */}
    {aulaAberta && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 16 }}
        onClick={e => e.target === e.currentTarget && setAulaAberta(null)}>
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, width: '100%', maxWidth: 860, maxHeight: '92vh', overflow: 'auto' }}
          onMouseDown={e => e.stopPropagation()}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--avp-border)' }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 1 }}>{moduloAberto?.titulo}</p>
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{aulaAberta.titulo}</h2>
            </div>
            <button onClick={() => setAulaAberta(null)} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 28, lineHeight: 1, padding: '0 4px' }}>×</button>
          </div>

          {/* Vídeo */}
          {aulaAberta.youtube_video_id ? (
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000' }}>
              <iframe
                src={`https://www.youtube.com/embed/${aulaAberta.youtube_video_id}?autoplay=1&rel=0`}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : aulaAberta.video_url ? (
            <video controls autoPlay src={aulaAberta.video_url} style={{ width: '100%', maxHeight: 480, background: '#000', display: 'block' }} />
          ) : (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--avp-text-dim)' }}>
              <p style={{ fontSize: 40, marginBottom: 10 }}>📄</p>
              <p>Esta aula não possui vídeo.</p>
            </div>
          )}

          {/* Info */}
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {aulaAberta.descricao && (
              <p style={{ fontSize: 14, color: 'var(--avp-text-dim)', lineHeight: 1.6, margin: 0 }}>{aulaAberta.descricao}</p>
            )}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {aulaAberta.duracao_minutos && <span style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>⏱ {aulaAberta.duracao_minutos} min</span>}
              {aulaAberta.quiz_aprovacao_minima != null && <span style={{ fontSize: 12, color: '#f59e0b' }}>📝 Quiz: {aulaAberta.quiz_qtd_questoes || '?'}q · {aulaAberta.quiz_aprovacao_minima}% mín.</span>}
              {aulaAberta.espera_horas != null && aulaAberta.espera_horas > 0 && <span style={{ fontSize: 12, color: '#60a5fa' }}>⏳ {aulaAberta.espera_horas}h de espera</span>}
              {(aulaAberta.liberacao_modo === 'manual_gestor' || aulaAberta.liberacao_modo === 'manual_admin') && <span style={{ fontSize: 12, color: '#a78bfa' }}>🔒 Liberação manual</span>}
            </div>
            {/* Navegação entre aulas */}
            {moduloAberto && moduloAberto.aulas.length > 1 && aulaAberta && (
              <NavAulas
                aulas={moduloAberto.aulas}
                aulaAtualId={aulaAberta.id}
                onPrev={setAulaAberta}
                onNext={setAulaAberta}
              />
            )}
          </div>
        </div>
      </div>
    )}

    <GestorLayout aba={aba} setAba={handleSetAba} nomeGestor={gestor.nome} fotoPerfilInicial={gestor.foto_perfil}>

      {/* ── DASHBOARD ── */}
      {aba === 'dashboard' && (
        <>
          <LiberacoesPendentes />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>Dashboard</h1>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Visão geral da sua equipe</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <MuralNoticias />
              <EventosWidget />
            </div>
          </div>

          {/* Cards de stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'FREE ativos', value: totalAtivos, cor: 'var(--avp-text)' },
              { label: 'Em andamento', value: emAndamento, cor: 'var(--avp-text)' },
              { label: 'Concluídos', value: concluidos, cor: 'var(--avp-green)' },
              { label: 'Progresso médio', value: `${mediaProgresso}%`, cor: '#3b82f6' },
              { label: 'Inativos 7 dias', value: inativos7d.length, cor: inativos7d.length > 0 ? '#f59e0b' : 'var(--avp-text)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--avp-card)', border: `1px solid ${s.label === 'Inativos 7 dias' && inativos7d.length > 0 ? '#f59e0b40' : 'var(--avp-border)'}`, borderRadius: 12, padding: 20 }}>
                <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, marginBottom: 6 }}>{s.label}</p>
                <p style={{ fontSize: 30, fontWeight: 800, color: s.cor }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Card PRO Gratuito por Rede */}
          {CardProGratuito({ prosIndicados: prosIndicados ?? 0 })}

          {/* Alerta de inativos */}
          {inativos7d.length > 0 && (
            <div style={{ background: '#92400e15', border: '1px solid #f59e0b40', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#f59e0b', marginBottom: 10 }}>
                ⚠️ {inativos7d.length} consultor{inativos7d.length > 1 ? 'es' : ''} sem estudar há mais de 7 dias
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {inativos7d.slice(0, 5).map(c => {
                  const dias = diasSemEstudar(c)
                  return (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{c.nome}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>
                          {dias === null ? 'nunca estudou' : `${dias}d sem estudar`}
                        </span>
                        <a href={`https://wa.me/55${c.whatsapp}?text=${encodeURIComponent(`Olá ${c.nome}! 👋 Vi que você está há alguns dias sem acessar a plataforma. Que tal retomar hoje? 🎓`)}`}
                          target="_blank" rel="noreferrer"
                          style={{ background: '#25d36620', border: '1px solid #25d36640', color: '#25d366', borderRadius: 6, padding: '4px 10px', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>
                          💬 WhatsApp
                        </a>
                      </div>
                    </div>
                  )
                })}
                {inativos7d.length > 5 && (
                  <button onClick={() => handleSetAba('consultores')} style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: 13, fontWeight: 600, textAlign: 'left', padding: 0 }}>
                    Ver mais {inativos7d.length - 5} →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Atalhos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
            <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20 }}>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>🔗 Link de cadastro</p>
              <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginBottom: 12 }}>Compartilhe com novos consultores</p>
              <button onClick={() => { navigator.clipboard.writeText(`${baseUrl}/g/${gestor.whatsapp}`); setLinkCopiado(true); setTimeout(() => setLinkCopiado(false), 2000) }}
                style={{ background: linkCopiado ? 'var(--avp-green)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                {linkCopiado ? '✓ Copiado!' : '📋 Copiar link'}
              </button>
            </div>
            <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>👥 Minha Equipe FREE</p>
              <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginBottom: 12 }}>{listaConsultores.length} membro{listaConsultores.length !== 1 ? 's' : ''} vinculado{listaConsultores.length !== 1 ? 's' : ''}</p>
              <button onClick={() => handleSetAba('consultores')}
                style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13, alignSelf: 'flex-start' }}>
                Ver todos →
              </button>
            </div>
          </div>

          {/* Últimos consultores */}
          {listaConsultores.length > 0 && (
            <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--avp-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: 14 }}>Atividade recente</p>
                <button onClick={() => handleSetAba('consultores')} style={{ background: 'none', border: 'none', color: 'var(--avp-blue)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Ver todos →</button>
              </div>
              {listaConsultores.slice(0, 5).map(c => {
                const pct = progressoMap[c.id] ?? 0
                const badge = badgeStatus[c.status] ?? { label: c.status, color: 'var(--avp-text-dim)', bg: 'var(--avp-border)' }
                return (
                  <div key={c.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--avp-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{c.nome}</p>
                      <BarraProgresso pct={pct} />
                    </div>
                    <span style={{ background: badge.bg, color: badge.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{badge.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── CONSULTORES ── */}
      {aba === 'consultores' && (
        <>
          <LiberacoesPendentes />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>Minha Equipe</h1>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Membros UNIAVP FREE do seu painel PRO</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <MuralNoticias />
              <EventosWidget />
              <a href="/api/gestor/relatorio-excel" download
                style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', color: 'var(--avp-text)', borderRadius: 8, padding: '9px 14px', fontWeight: 600, cursor: 'pointer', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                📊 Exportar Excel
              </a>
              <button onClick={() => setShowNovoConsultor(true)}
                style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                ➕ Cadastrar FREE
              </button>
            </div>
          </div>

          {/* ── Links de captação visíveis ── */}
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 18, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>🔗 Links de Captação — compartilhe com futuros consultores</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {/* Funil completo */}
              <div style={{ background: 'var(--avp-black)', borderRadius: 8, padding: '12px 14px' }}>
                <p style={{ fontWeight: 700, fontSize: 12, marginBottom: 2 }}>🎯 Funil Completo</p>
                <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginBottom: 8 }}>Para quem não conhece — passa por perguntas + vídeo</p>
                <p style={{ fontSize: 10, color: '#6366f1', fontFamily: 'monospace', marginBottom: 8, wordBreak: 'break-all' as const }}>{baseUrl}/g/{gestor.whatsapp}</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { navigator.clipboard.writeText(`${baseUrl}/g/${gestor.whatsapp}`); setLinkCopiado(true); setTimeout(() => setLinkCopiado(false), 2000) }}
                    style={{ flex: 1, background: linkCopiado ? 'var(--avp-green)' : '#333687', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 10px', cursor: 'pointer', fontWeight: 700, fontSize: 11 }}>
                    {linkCopiado ? '✓ Copiado!' : '📋 Copiar'}
                  </button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`📲 Cadastre-se na plataforma:\n\n${baseUrl}/g/${gestor.whatsapp}`)}`} target="_blank" rel="noreferrer"
                    style={{ background: '#25d36620', border: '1px solid #25d36640', color: '#25d366', borderRadius: 6, padding: '7px 10px', textDecoration: 'none', fontSize: 11, fontWeight: 700 }}>
                    WhatsApp
                  </a>
                </div>
              </div>
              {/* Acesso direto */}
              <div style={{ background: 'var(--avp-black)', borderRadius: 8, padding: '12px 14px' }}>
                <p style={{ fontWeight: 700, fontSize: 12, marginBottom: 2 }}>⚡ Acesso Direto</p>
                <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginBottom: 8 }}>Para quem já conhece — vai direto ao cadastro</p>
                <p style={{ fontSize: 10, color: '#f59e0b', fontFamily: 'monospace', marginBottom: 8, wordBreak: 'break-all' as const }}>{baseUrl}/g/{gestor.whatsapp}?direto=1</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { navigator.clipboard.writeText(`${baseUrl}/g/${gestor.whatsapp}?direto=1`); setLinkCopiado(true); setTimeout(() => setLinkCopiado(false), 2000) }}
                    style={{ flex: 1, background: linkCopiado ? 'var(--avp-green)' : '#92400e', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 10px', cursor: 'pointer', fontWeight: 700, fontSize: 11 }}>
                    {linkCopiado ? '✓ Copiado!' : '📋 Copiar'}
                  </button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`📲 Acesse a plataforma:\n\n${baseUrl}/g/${gestor.whatsapp}?direto=1`)}`} target="_blank" rel="noreferrer"
                    style={{ background: '#25d36620', border: '1px solid #25d36640', color: '#25d366', borderRadius: 6, padding: '7px 10px', textDecoration: 'none', fontSize: 11, fontWeight: 700 }}>
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'FREE ativos', value: totalAtivos },
              { label: 'Em andamento', value: emAndamento },
              { label: 'Concluídos', value: concluidos },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20 }}>
                <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, marginBottom: 6 }}>{s.label}</p>
                <p style={{ fontSize: 32, fontWeight: 800 }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, overflow: 'hidden' }}>
            {/* Desktop: tabela | Mobile: cards */}
            <div className="table-scroll hide-mobile" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--avp-border)' }}>
                    {['Nome', 'Progresso', 'Último estudo', 'Indicou', 'Status', 'Ações'].map(h => (
                      <th key={h} style={{ padding: '13px 16px', textAlign: 'left', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {listaConsultores.map(c => {
                    const pct = progressoMap[c.id] ?? 0
                    const badge = badgeStatus[c.status] ?? { label: c.status, color: 'var(--avp-text-dim)', bg: 'var(--avp-border)' }
                    const dias = diasSemEstudar(c)
                    const indicou = indicacoesMap[c.whatsapp] ?? 0
                    const alertaInativo = c.status === 'ativo' && (dias === null || dias >= 7)
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--avp-border)', background: alertaInativo ? '#92400e08' : 'transparent' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <p onClick={() => abrirConsultor(c)} style={{ fontWeight: 700, cursor: 'pointer', fontSize: 14, marginBottom: 2 }}>{c.nome}</p>
                          <p style={{ fontSize: 11, color: 'var(--avp-text-dim)' }}>{c.whatsapp}</p>
                        </td>
                        <td style={{ padding: '12px 16px', minWidth: 140 }}><BarraProgresso pct={pct} /></td>
                        <td style={{ padding: '12px 16px' }}>
                          {dias === null
                            ? <span style={{ fontSize: 12, color: '#f59e0b' }}>Nunca estudou</span>
                            : dias === 0
                              ? <span style={{ fontSize: 12, color: 'var(--avp-green)', fontWeight: 600 }}>🔥 Hoje</span>
                              : <span style={{ fontSize: 12, color: dias >= 7 ? '#f59e0b' : 'var(--avp-text-dim)' }}>{dias === 1 ? 'Ontem' : `${dias}d atrás`}</span>
                          }
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {indicou > 0
                            ? <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--avp-green)' }}>{indicou}</span>
                            : <span style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>—</span>
                          }
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: badge.bg, color: badge.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{badge.label}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <a href={`https://wa.me/55${c.whatsapp}`} target="_blank" rel="noreferrer"
                              style={{ background: '#25d36620', border: '1px solid #25d36640', color: '#25d366', borderRadius: 6, padding: '4px 10px', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>
                              💬
                            </a>
                            {c.status === 'ativo' && (
                              <button onClick={() => alterarStatus(c, 'pausado')}
                                style={{ background: '#f59e0b15', border: '1px solid #f59e0b30', color: '#f59e0b', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                Pausar
                              </button>
                            )}
                            {c.status === 'pausado' && (
                              <button onClick={() => alterarStatus(c, 'ativo')}
                                style={{ background: '#02A15320', border: '1px solid #02A15340', color: 'var(--avp-green)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                Reativar
                              </button>
                            )}
                            {c.status !== 'concluido' && (
                              <button onClick={() => removerConsultor(c)}
                                style={{ background: '#e6394615', border: '1px solid #e6394630', color: 'var(--avp-danger)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                Remover
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {listaConsultores.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--avp-text-dim)' }}>Nenhum consultor vinculado. Clique em "+ Novo consultor".</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="show-mobile" style={{ flexDirection: 'column', gap: 10, padding: 12 }}>
              {listaConsultores.length === 0 && (
                <p style={{ textAlign: 'center', padding: 32, color: 'var(--avp-text-dim)', fontSize: 14 }}>Nenhum consultor vinculado ainda.</p>
              )}
              {listaConsultores.map(c => {
                const pct = progressoMap[c.id] ?? 0
                const badge = badgeStatus[c.status] ?? { label: c.status, color: 'var(--avp-text-dim)', bg: 'var(--avp-border)' }
                const dias = diasSemEstudar(c)
                const indicou = indicacoesMap[c.whatsapp] ?? 0
                const alertaInativo = c.status === 'ativo' && (dias === null || dias >= 7)
                return (
                  <div key={c.id} style={{ background: alertaInativo ? '#92400e10' : 'var(--avp-black)', border: `1px solid ${alertaInativo ? '#f59e0b30' : 'var(--avp-border)'}`, borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <p onClick={() => abrirConsultor(c)} style={{ fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 2 }}>{c.nome}</p>
                        <p style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>{c.whatsapp}</p>
                      </div>
                      <span style={{ background: badge.bg, color: badge.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{badge.label}</span>
                    </div>
                    <BarraProgresso pct={pct} />
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', fontSize: 11, color: 'var(--avp-text-dim)' }}>
                      {dias === null ? <span style={{ color: '#f59e0b' }}>⚠ Nunca estudou</span>
                        : dias === 0 ? <span style={{ color: 'var(--avp-green)' }}>🔥 Estudou hoje</span>
                        : <span style={{ color: dias >= 7 ? '#f59e0b' : 'var(--avp-text-dim)' }}>{dias === 1 ? '📅 Ontem' : `📅 ${dias}d atrás`}</span>}
                      {indicou > 0 && <span style={{ color: 'var(--avp-green)', fontWeight: 700 }}>🤝 {indicou} indicado{indicou > 1 ? 's' : ''}</span>}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                        <button onClick={() => abrirConsultor(c)} style={{ background: 'var(--avp-border)', color: 'var(--avp-text)', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Ver progresso</button>
                        <a href={`https://wa.me/55${c.whatsapp}`} target="_blank" rel="noreferrer" style={{ background: '#25d36620', border: '1px solid #25d36640', color: '#25d366', borderRadius: 6, padding: '5px 10px', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>💬 WhatsApp</a>
                        <a href={`/gestor/artes/${c.whatsapp}`} style={{ background: '#8b5cf620', border: '1px solid #8b5cf640', color: '#a78bfa', borderRadius: 6, padding: '5px 10px', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>🎨 Artes</a>
                        {c.status === 'ativo' && <button onClick={() => alterarStatus(c, 'pausado')} style={{ background: '#f59e0b15', border: '1px solid #f59e0b30', color: '#f59e0b', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Pausar</button>}
                        {c.status === 'pausado' && <button onClick={() => alterarStatus(c, 'ativo')} style={{ background: '#02A15320', border: '1px solid #02A15340', color: 'var(--avp-green)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Reativar</button>}
                        {c.status !== 'concluido' && <button onClick={() => removerConsultor(c)} style={{ background: '#e6394615', border: '1px solid #e6394630', color: 'var(--avp-danger)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Remover</button>}
                      </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ── AULAS ── */}
      {aba === 'aulas' && (
        <>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            {moduloAberto && (
              <button onClick={() => setModuloAberto(null)}
                style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', color: 'var(--avp-text-dim)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                ← Voltar
              </button>
            )}
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
                {moduloAberto ? moduloAberto.titulo : 'Estrutura do Curso'}
              </h1>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, margin: '3px 0 0' }}>
                {moduloAberto
                  ? `${moduloAberto.aulas.length} aula${moduloAberto.aulas.length !== 1 ? 's' : ''} — visão administrativa`
                  : 'Visão geral do currículo · Os consultores seguem a ordem com quiz obrigatório'}
              </p>
            </div>
          </div>

          {!aulasCarregadas && (
            <div style={{ textAlign: 'center', padding: 64, color: 'var(--avp-text-dim)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              <p>Carregando módulos...</p>
            </div>
          )}

          {/* Aviso de aulas não publicadas */}
          {aulasCarregadas && !moduloAberto && <AvisoAulasNaoPublicadas modulosAulas={modulosAulas} />}

          {/* ── LISTA DE MÓDULOS (pasta) ── */}
          {aulasCarregadas && !moduloAberto && (
            <>
              {modulosAulas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 64, color: 'var(--avp-text-dim)', background: 'var(--avp-card)', borderRadius: 12, border: '1px solid var(--avp-border)' }}>
                  <p style={{ fontSize: 40, marginBottom: 12 }}>📚</p>
                  <p>Nenhum módulo disponível ainda.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
                  {modulosAulas.map(mod => (
                    <div key={mod.id} onClick={() => setModuloAberto(mod)}
                      style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-3px)'; el.style.borderColor = 'var(--avp-green)'; el.style.boxShadow = '0 8px 24px rgba(2,161,83,0.15)' }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = ''; el.style.borderColor = 'var(--avp-border)'; el.style.boxShadow = '' }}
                    >
                      {/* Capa do módulo */}
                      <div style={{ height: 130, background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {mod.capa_url
                          ? <img src={mod.capa_url} alt={mod.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                          : capaDefault
                            ? <img src={capaDefault} alt="capa" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                            : <span style={{ fontSize: 48 }}>📁</span>
                        }
                        {/* Badge de quantidade */}
                        <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.65)', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#fff', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
                          {mod.aulas.length} aula{mod.aulas.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div style={{ padding: '14px 16px' }}>
                        <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 4px', lineHeight: 1.3 }}>{mod.titulo}</p>
                        <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>📂</span> Clique para abrir
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── AULAS DENTRO DO MÓDULO ── */}
          {aulasCarregadas && moduloAberto && (
            <>
              {moduloAberto.aulas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: 'var(--avp-text-dim)', background: 'var(--avp-card)', borderRadius: 12, border: '1px solid var(--avp-border)' }}>
                  <p style={{ fontSize: 36, marginBottom: 10 }}>📭</p>
                  <p>Nenhuma aula neste módulo.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                  {moduloAberto.aulas.map((aula, idx) => {
                    const thumb = aula.capa_url || (aula.youtube_video_id ? `https://img.youtube.com/vi/${aula.youtube_video_id}/mqdefault.jpg` : null)
                    const temVideo = !!(aula.youtube_video_id || aula.video_url)
                    return (
                      <div key={aula.id}
                        onClick={() => setAulaAberta(aula)}
                        style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, overflow: 'hidden', opacity: aula.publicado ? 1 : 0.6, cursor: 'pointer', transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s' }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-3px)'; el.style.borderColor = 'var(--avp-blue)'; el.style.boxShadow = '0 8px 24px rgba(59,130,246,0.15)' }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = ''; el.style.borderColor = 'var(--avp-border)'; el.style.boxShadow = '' }}
                      >
                        <div style={{ height: 120, background: 'var(--grad-brand)', position: 'relative', overflow: 'hidden' }}>
                          {thumb && <img src={thumb} alt={aula.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />}
                          {/* Play overlay */}
                          {temVideo && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)', opacity: 0, transition: 'opacity 0.2s' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0' }}>
                              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#1a1a1a"><polygon points="5,3 19,12 5,21"/></svg>
                              </div>
                            </div>
                          )}
                          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.65)', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#fff', fontWeight: 700 }}>
                            #{idx + 1}
                          </div>
                          {!aula.publicado && (
                            <div style={{ position: 'absolute', top: 8, right: 8, background: '#f59e0b', borderRadius: 4, padding: '2px 7px', fontSize: 9, fontWeight: 700, color: '#fff' }}>RASCUNHO</div>
                          )}
                        </div>
                        <div style={{ padding: '12px 14px' }}>
                          <p style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, marginBottom: 6 }}>{aula.titulo}</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {aula.duracao_minutos && (
                              <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: 0 }}>⏱ {aula.duracao_minutos} min</p>
                            )}
                            {aula.quiz_aprovacao_minima != null && (
                              <p style={{ fontSize: 11, color: '#f59e0b', margin: 0 }}>📝 Quiz: {aula.quiz_qtd_questoes || '?'}q · {aula.quiz_aprovacao_minima}% mín.</p>
                            )}
                            {aula.espera_horas != null && aula.espera_horas > 0 && (
                              <p style={{ fontSize: 11, color: '#60a5fa', margin: 0 }}>⏳ {aula.espera_horas}h de espera</p>
                            )}
                            {(aula.liberacao_modo === 'manual_gestor' || aula.liberacao_modo === 'manual_admin') && (
                              <p style={{ fontSize: 11, color: '#a78bfa', margin: 0 }}>🔒 Liberação manual</p>
                            )}
                            {!temVideo && <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: 0 }}>📄 Sem vídeo</p>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

        </>
      )}

      {/* ── EVENTOS ── */}
      {aba === 'eventos' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>Eventos</h1>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Crie eventos e notifique sua equipe</p>
            </div>
            <button onClick={() => setShowEvento(s => !s)}
              style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              {showEvento ? 'Cancelar' : '+ Novo Evento'}
            </button>
          </div>

          {msgEvento && (
            <div style={{ padding: '10px 16px', background: msgEvento.includes('Erro') ? '#e6394620' : '#02A15320', border: `1px solid ${msgEvento.includes('Erro') ? 'var(--avp-danger)' : 'var(--avp-green)'}`, borderRadius: 8, color: msgEvento.includes('Erro') ? 'var(--avp-danger)' : 'var(--avp-green)', fontSize: 14, marginBottom: 16 }}>{msgEvento}</div>
          )}

          {showEvento && (
            <form onSubmit={salvarEvento} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>Novo Evento</h3>
              <div className="evento-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 4 }}>Título *</label><input required value={eventoForm.titulo} onChange={e => setEventoForm(p => ({ ...p, titulo: e.target.value }))} style={inp} /></div>
                <div><label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 4 }}>Cidade</label><input value={eventoForm.cidade} onChange={e => setEventoForm(p => ({ ...p, cidade: e.target.value }))} style={inp} /></div>
                <div><label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 4 }}>Data e Hora *</label><input required type="datetime-local" value={eventoForm.data_hora} onChange={e => setEventoForm(p => ({ ...p, data_hora: e.target.value }))} style={inp} /></div>
                <div><label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 4 }}>Descrição</label><input value={eventoForm.descricao} onChange={e => setEventoForm(p => ({ ...p, descricao: e.target.value }))} style={inp} /></div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={eventoForm.notificar} onChange={e => setEventoForm(p => ({ ...p, notificar: e.target.checked }))} style={{ width: 16, height: 16, accentColor: 'var(--avp-green)' }} />
                <span style={{ fontSize: 14 }}>Notificar meus consultores via WhatsApp</span>
              </label>
              <button type="submit" disabled={salvandoEvento} style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14, alignSelf: 'flex-start', opacity: salvandoEvento ? 0.7 : 1 }}>
                {salvandoEvento ? 'Salvando...' : 'Criar Evento'}
              </button>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {eventos.length === 0 && !showEvento && (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--avp-text-dim)', background: 'var(--avp-card)', borderRadius: 12, border: '1px solid var(--avp-border)' }}>
                Nenhum evento criado ainda. Clique em "+ Novo Evento" para criar.
              </div>
            )}
            {eventos.map(ev => (
              <div key={ev.id} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>{ev.titulo}</p>
                  <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 4 }}>
                    📅 {new Date(ev.data_hora).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {ev.cidade && ` · 📍 ${ev.cidade}`}
                  </p>
                </div>
                <button onClick={() => removerEvento(ev.id)} style={{ background: 'var(--avp-danger)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>Remover</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── WHATSAPP ── */}
      {aba === 'whatsapp' && (
        <>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>WhatsApp</h1>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Conecte seu WhatsApp para receber notificações dos consultores</p>
          </div>
          <div style={{ maxWidth: 500 }}>
            <WhatsAppConectar />
          </div>
          <div style={{ marginTop: 20, background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20, maxWidth: 500 }}>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>📲 Como funciona</p>
            <ul style={{ color: 'var(--avp-text-dim)', fontSize: 14, lineHeight: 2, paddingLeft: 20 }}>
              <li>Conecte seu WhatsApp pessoal ou de negócios</li>
              <li>Você receberá alertas quando um consultor concluir uma aula</li>
              <li>Seus consultores recebem notificações de novos eventos</li>
              <li>Fique por dentro do progresso da sua equipe em tempo real</li>
            </ul>
          </div>
        </>
      )}

      {/* Modal progresso consultor */}
      {consultorSelecionado && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => e.target === e.currentTarget && (setConsultorSelecionado(null), setModulos([]))}>
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32, width: 560, maxWidth: '95vw', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>{consultorSelecionado.nome}</h2>
                <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 2 }}>{consultorSelecionado.whatsapp} · {consultorSelecionado.email}</p>
              </div>
              <button onClick={() => { setConsultorSelecionado(null); setModulos([]) }} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 24 }}>×</button>
            </div>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progresso por módulo</p>
            {carregandoModulos ? (
              <p style={{ color: 'var(--avp-text-dim)', textAlign: 'center', padding: 24 }}>Carregando...</p>
            ) : modulos.length === 0 ? (
              <p style={{ color: 'var(--avp-text-dim)', textAlign: 'center', padding: 24 }}>Nenhum módulo encontrado.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {modulos.map((m, i) => {
                  const cor = m.percentual === 100 ? 'var(--avp-green)' : m.percentual > 0 ? 'var(--avp-blue)' : 'var(--avp-border)'
                  return (
                    <div key={i} style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{m.titulo}</span>
                        <span style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>{m.aulas_concluidas}/{m.aulas_total} aulas</span>
                      </div>
                      <div style={{ background: 'var(--avp-border)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${m.percentual}%`, background: cor, height: '100%', borderRadius: 100 }} />
                      </div>
                      <div style={{ textAlign: 'right', marginTop: 4 }}>
                        <span style={{ fontSize: 12, color: m.percentual === 100 ? 'var(--avp-green)' : 'var(--avp-text-dim)' }}>
                          {m.percentual === 100 ? '✓ Concluído' : `${m.percentual}%`}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {/* ── ARTES ── */}
      {aba === 'artes' && (
        <>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>🎨 Artes</h1>
          </div>

          {/* Sub-abas */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--avp-border)', paddingBottom: 0 }}>
            {([['templates', '🖼️ Templates'], ['consultores', '👥 Gerar para Consultor']] as const).map(([id, label]) => (
              <button key={id}
                onClick={() => setArtesSubAba(id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '10px 16px', fontWeight: 700, fontSize: 14,
                  color: artesSubAba === id ? 'var(--avp-text)' : 'var(--avp-text-dim)',
                  borderBottom: artesSubAba === id ? '2px solid #8b5cf6' : '2px solid transparent',
                  marginBottom: -1, transition: 'all 0.15s',
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Templates */}
          {artesSubAba === 'templates' && (
            <GestorArtesTemplates inicial={artesTemplates} gestorId={gestor.id} />
          )}

          {/* Consultores */}
          {artesSubAba === 'consultores' && (
            listaConsultores.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 64, color: 'var(--avp-text-dim)', background: 'var(--avp-card)', borderRadius: 12, border: '1px solid var(--avp-border)' }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>🎨</p>
                <p>Você ainda não tem consultores cadastrados.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                {listaConsultores.map(c => {
                  const statusInfo = badgeStatus[c.status] ?? badgeStatus.ativo
                  return (
                    <a key={c.id} href={`/gestor/artes/${c.whatsapp}`}
                      style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, overflow: 'hidden', textDecoration: 'none', color: 'var(--avp-text)', display: 'block', transition: 'transform 0.15s, border-color 0.15s' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.transform = 'translateY(-2px)'; el.style.borderColor = '#8b5cf6' }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.transform = ''; el.style.borderColor = 'var(--avp-border)' }}
                    >
                      <div style={{ height: 80, background: 'linear-gradient(135deg, #4c1d95, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                        🎨
                      </div>
                      <div style={{ padding: '12px 14px' }}>
                        <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 11, color: statusInfo.color, fontWeight: 600 }}>{statusInfo.label}</span>
                          <span style={{ fontSize: 12, color: '#a78bfa', fontWeight: 700 }}>Gerar →</span>
                        </div>
                      </div>
                    </a>
                  )
                })}
              </div>
            )
          )}
        </>
      )}

      {/* ── PERFIL DO GESTOR ── */}
      {aba === 'perfil' && (
        <PerfilGestor gestor={gestor} onNomeAtualizado={(_nome) => { /* update handled internally */ }} />
      )}

    </GestorLayout>
    </>
  )
}
