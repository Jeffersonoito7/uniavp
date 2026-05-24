'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import ConfiguracoesCliente from '@/app/admin/configuracoes/ConfiguracoesCliente'

type Cliente = { id: string; nome: string; dominio: string | null; ativo: boolean | null; contato_nome: string | null; contato_whatsapp: string | null; contato_email: string | null; observacoes: string | null; created_at: string | null; gestor_ativo: boolean | null; limite_consultores: number | null; cpf_cnpj?: string | null; sede_mei?: string | null; cnpj_mei?: string | null; mensalidade?: number | null; status_pagamento?: string | null; vencimento_dia?: number | null; pix_txid?: string | null; ultimo_pagamento?: string | null; whatsapp_instancia?: string | null }
type Stats = { totalAlunos: number; totalGestores: number; totalAdmins: number; totalModulos: number; totalAulas: number }
type Config = { chave: string; valor: string | null; descricao?: string | null }
type PlanoSaaS = { id: string; nome: string; descricao: string; preco: number; preco_label?: string; gestor_ativo: boolean; limite_consultores: number; destaque: boolean; ativo: boolean; recursos: string[] }

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? '')

// SVG icon set
const Icons = {
  dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  clients: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  plans: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  test: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11l3 3 3-3V3M5 9H3m18 0h-2M5 14H3m18 0h-2"/></svg>,
  invoice: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  settings: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  billing: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  logout: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  chevronLeft: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  chevronRight: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  external: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  close: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  rocket: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
  copy: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  pix: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
}

export default function SuperDashboard({ nome, clientes: inicial, stats, recentesAlunos, configs }: {
  nome: string; clientes: Cliente[]; stats: Stats; recentesAlunos: { nome: string; created_at: string | null; status: string }[]; configs: Config[]
}) {
  const [clientes, setClientes] = useState<Cliente[]>(inicial)
  const [aba, setAba] = useState<'dashboard' | 'clientes' | 'novo' | 'testar' | 'cobranca' | 'boleto_avulso' | 'configuracoes' | 'planos'>('dashboard')
  const [onboardingId, setOnboardingId] = useState<string | null>(null)
  const [onboardingForm, setOnboardingForm] = useState({ admin_email: '', admin_nome: '', admin_senha: '', dominio: '' })
  const [onboardingMsg, setOnboardingMsg] = useState<string[]>([])
  const [onboardingLoading, setOnboardingLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const [colapsada, setColapsada] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check); return () => window.removeEventListener('resize', check)
  }, [])
  useEffect(() => { if (isMobile) setMenuAberto(false) }, [aba, isMobile])
  const [tipoNovo, setTipoNovo] = useState<'' | 'empresa' | 'lideranca' | 'gestor' | 'consultor'>('')
  const [cobrancaClienteId, setCobrancaClienteId] = useState<string | null>(null)
  const [gerandoPix, setGerandoPix] = useState<string | null>(null)
  const [cobrancaMsg, setCobrancaMsg] = useState('')
  const [registrandoWebhook, setRegistrandoWebhook] = useState(false)
  const [form, setForm] = useState({ nome: '', dominio: '', contato_nome: '', contato_whatsapp: '', contato_email: '', observacoes: '', gestor_ativo: false, limite_consultores: 30 })
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')
  const [editando, setEditando] = useState<Cliente | null>(null)

  const PLANOS_DEFAULT: PlanoSaaS[] = [
    { id: 'starter', nome: 'Starter', descricao: 'Ideal para associações em crescimento', preco: 0, gestor_ativo: false, limite_consultores: 100, destaque: false, ativo: true, recursos: ['Módulos e aulas ilimitadas', 'Área do consultor', 'Painel admin completo', 'Quiz e certificados', 'Contratos digitais', 'Suporte por WhatsApp'] },
    { id: 'profissional', nome: 'Profissional', descricao: 'Para associações consolidadas', preco: 0, gestor_ativo: false, limite_consultores: 500, destaque: true, ativo: true, recursos: ['Tudo do Starter', 'Até 500 consultores', 'Ranking e gamificação', 'Artes para redes sociais', 'Relatórios avançados', 'Onboarding guiado'] },
    { id: 'enterprise', nome: 'Enterprise', descricao: 'Solução completa para grandes associações', preco: 0, gestor_ativo: true, limite_consultores: 9999, destaque: false, ativo: true, recursos: ['Tudo do Profissional', 'Painel exclusivo para usuários PRO', 'Consultores ilimitados', 'Domínio próprio incluso', 'Suporte prioritário', 'Treinamento da equipe'] },
  ]
  const [planos, setPlanos] = useState<PlanoSaaS[]>(PLANOS_DEFAULT)
  const [planosCarregados, setPlanosCarregados] = useState(false)
  const [salvandoPlanos, setSalvandoPlanos] = useState(false)
  const [msgPlanos, setMsgPlanos] = useState('')
  const [editandoPlano, setEditandoPlano] = useState<string | null>(null)
  const [novoRecurso, setNovoRecurso] = useState<Record<string, string>>({})

  useEffect(() => {
    if (aba === 'planos' && !planosCarregados) {
      fetch('/api/super/planos').then(r => r.json()).then(data => { setPlanos(data); setPlanosCarregados(true) }).catch(() => {})
    }
  }, [aba, planosCarregados])

  async function salvarPlanos() {
    setSalvandoPlanos(true); setMsgPlanos('')
    const res = await fetch('/api/super/planos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(planos) })
    setSalvandoPlanos(false)
    setMsgPlanos(res.ok ? 'Planos salvos com sucesso.' : 'Erro ao salvar planos.')
    setTimeout(() => setMsgPlanos(''), 3000)
  }

  function atualizarPlano(id: string, campo: keyof PlanoSaaS, valor: any) {
    setPlanos(prev => prev.map(p => p.id === id ? { ...p, [campo]: valor } : p))
  }

  function adicionarRecurso(planoId: string) {
    const txt = novoRecurso[planoId]?.trim()
    if (!txt) return
    setPlanos(prev => prev.map(p => p.id === planoId ? { ...p, recursos: [...p.recursos, txt] } : p))
    setNovoRecurso(prev => ({ ...prev, [planoId]: '' }))
  }

  function removerRecurso(planoId: string, idx: number) {
    setPlanos(prev => prev.map(p => p.id === planoId ? { ...p, recursos: p.recursos.filter((_, i) => i !== idx) } : p))
  }

  const hoje = new Date(); hoje.setDate(hoje.getDate() + 7)
  const dataDefaultVenc = hoje.toISOString().split('T')[0]
  const [bAvulso, setBAvulso] = useState({ nome: '', cpfCnpj: '', valor: '', vencimento: dataDefaultVenc, descricao: '', email: '', whatsapp: '', mensagem: '' })
  const [bAvulsoLoading, setBAvulsoLoading] = useState(false)
  const [bAvulsoMsg, setBAvulsoMsg] = useState('')
  const [bAvulsoResultado, setBAvulsoResultado] = useState<{ codigoBarras: string; pdfUrl: string } | null>(null)

  async function gerarBoletoAvulso() {
    if (!bAvulso.nome || !bAvulso.cpfCnpj || !bAvulso.valor || !bAvulso.vencimento) {
      setBAvulsoMsg('Preencha nome, CPF/CNPJ, valor e vencimento.')
      return
    }
    setBAvulsoLoading(true); setBAvulsoMsg(''); setBAvulsoResultado(null)
    const res = await fetch('/api/super/boleto-avulso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bAvulso),
    })
    const data = await res.json()
    if (!res.ok) {
      setBAvulsoMsg(data.error ?? 'Erro ao gerar boleto')
    } else {
      setBAvulsoResultado(data.boleto)
      setBAvulsoMsg('Boleto gerado com sucesso.')
    }
    setBAvulsoLoading(false)
  }

  async function sair() {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await sb.auth.signOut()
    window.location.href = '/super/login'
  }

  async function rodarOnboarding(clienteId: string) {
    setOnboardingLoading(true); setOnboardingMsg([])
    const res = await fetch('/api/super/onboarding', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente_id: clienteId, ...onboardingForm }),
    })
    const data = await res.json()
    setOnboardingMsg(data.resultados ?? [data.error ?? 'Erro'])
    setOnboardingLoading(false)
  }

  async function salvarCliente() {
    if (!form.nome) { setMsg('Informe o nome do cliente.'); return }
    setSalvando(true); setMsg('')
    const res = await fetch('/api/super/clientes', {
      method: editando ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editando ? { ...form, id: editando.id } : form),
    })
    const data = await res.json()
    if (res.ok) {
      if (editando) setClientes(prev => prev.map(c => c.id === editando.id ? data : c))
      else setClientes(prev => [...prev, data])
      setForm({ nome: '', dominio: '', contato_nome: '', contato_whatsapp: '', contato_email: '', observacoes: '', gestor_ativo: false, limite_consultores: 30 })
      setEditando(null); setTipoNovo(''); setAba('clientes'); setMsg('Cliente salvo.')
    } else setMsg(`Erro: ${data.error || res.status}`)
    setSalvando(false)
  }

  async function toggleAtivo(c: Cliente) {
    await fetch('/api/super/clientes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, ativo: !c.ativo }) })
    setClientes(prev => prev.map(x => x.id === c.id ? { ...x, ativo: !x.ativo } : x))
  }

  async function excluirCliente(c: Cliente) {
    if (!confirm(`Excluir "${c.nome}" permanentemente? Esta ação não pode ser desfeita.`)) return
    const res = await fetch('/api/super/clientes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id }) })
    if (res.ok) setClientes(prev => prev.filter(x => x.id !== c.id))
    else alert('Erro ao excluir.')
  }

  function iniciarEdicao(c: Cliente) {
    setForm({ nome: c.nome, dominio: c.dominio ?? '', contato_nome: c.contato_nome ?? '', contato_whatsapp: c.contato_whatsapp ?? '', contato_email: c.contato_email ?? '', observacoes: c.observacoes ?? '', gestor_ativo: c.gestor_ativo ?? false, limite_consultores: c.limite_consultores || 30 })
    setEditando(c); setTipoNovo('empresa'); setAba('novo')
  }

  function getTipoCliente(c: Cliente): 'lideranca' | 'associacao' {
    try { const o = JSON.parse(c.observacoes || '{}'); if (o._tipo === 'lideranca') return 'lideranca' } catch { /**/ }
    return 'associacao'
  }

  function getObsLimpa(c: Cliente): string {
    try { const o = JSON.parse(c.observacoes || '{}'); return o.obs || '' } catch { return c.observacoes || '' }
  }

  // Shared styles
  const C = {
    bg: '#0a0a0f', card: '#0f0f17', border: '#1e1f2e', accent: '#4f46e5',
    text: '#f1f5f9', dim: '#64748b', muted: '#94a3b8',
  }
  const inp: React.CSSProperties = { width: '100%', background: '#080810', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', color: C.muted, fontSize: 11, fontWeight: 700, marginBottom: 5, letterSpacing: '0.04em', textTransform: 'uppercase' }
  const card: React.CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 10 }
  const btn: React.CSSProperties = { background: C.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', letterSpacing: '0.01em' }
  const btnGhost: React.CSSProperties = { background: 'none', border: `1px solid ${C.border}`, color: C.dim, borderRadius: 8, padding: '9px 16px', fontWeight: 500, fontSize: 13, cursor: 'pointer' }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.dashboard },
    { id: 'clientes', label: 'Clientes', icon: Icons.clients },
    { id: 'novo', label: 'Novo Cliente', icon: Icons.plus },
    { id: 'planos', label: 'Planos / Vendas', icon: Icons.plans },
    { id: 'testar', label: 'Testar', icon: Icons.test },
    { id: 'boleto_avulso', label: 'Boleto Avulso', icon: Icons.invoice },
    { id: 'configuracoes', label: 'Configurações', icon: Icons.settings },
    { id: 'cobranca', label: 'Cobranças', icon: Icons.billing },
  ] as const

  const sidebarW = colapsada ? 56 : 220

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'Inter, system-ui, sans-serif', display: 'flex' }}>

      {/* Topbar mobile */}
      {isMobile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 52, zIndex: 400, background: C.card, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 12 }}>
          <button onClick={() => setMenuAberto(m => !m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text, display: 'flex', padding: 4 }}>
            {menuAberto ? Icons.close : Icons.menu}
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>Painel Master</span>
        </div>
      )}

      {/* Overlay mobile */}
      {isMobile && menuAberto && (
        <div onClick={() => setMenuAberto(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 450 }} />
      )}

      {/* Sidebar */}
      <aside style={{
        background: C.card, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        ...(isMobile ? {
          width: 220, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 500,
          transform: menuAberto ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.22s ease',
        } : {
          width: sidebarW, position: 'sticky', top: 0, height: '100vh', flexShrink: 0,
          transition: 'width 0.2s ease', overflowY: 'auto',
        }),
      }}>
        <div style={{ padding: colapsada ? '16px 8px' : '16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: colapsada ? 'center' : 'space-between', gap: 8 }}>
          {!colapsada && (
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>Oito7 Digital</p>
              <p style={{ fontSize: 11, color: C.dim, margin: '2px 0 0' }}>Painel Master</p>
            </div>
          )}
          {!isMobile && (
            <button onClick={() => setColapsada(c => !c)} style={{ background: 'none', border: `1px solid ${C.border}`, cursor: 'pointer', color: C.dim, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 6 }}>
              {colapsada ? Icons.chevronRight : Icons.chevronLeft}
            </button>
          )}
          {isMobile && (
            <button onClick={() => setMenuAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.dim, display: 'flex', padding: 4 }}>
              {Icons.close}
            </button>
          )}
        </div>

        <nav style={{ flex: 1, padding: colapsada ? '10px 8px' : '10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {navItems.map(item => {
            const active = aba === item.id
            return (
              <button key={item.id}
                onClick={() => { setAba(item.id as any); if (item.id !== 'novo') { setEditando(null); setTipoNovo(''); setForm({ nome: '', dominio: '', contato_nome: '', contato_whatsapp: '', contato_email: '', observacoes: '', gestor_ativo: false, limite_consultores: 30 }) } if (isMobile) setMenuAberto(false) }}
                title={colapsada ? item.label : undefined}
                style={{ display: 'flex', alignItems: 'center', gap: colapsada ? 0 : 10, justifyContent: colapsada ? 'center' : 'flex-start', padding: colapsada ? '10px 0' : '9px 10px', borderRadius: 7, fontSize: 13, fontWeight: active ? 600 : 400, color: active ? C.text : C.dim, background: active ? `${C.accent}18` : 'transparent', border: active ? `1px solid ${C.accent}30` : '1px solid transparent', cursor: 'pointer', textAlign: 'left', width: '100%', whiteSpace: 'nowrap', transition: 'all 0.12s' }}>
                <span style={{ flexShrink: 0, color: active ? C.accent : 'inherit' }}>{item.icon}</span>
                {!colapsada && <span>{item.label}</span>}
              </button>
            )
          })}
          {!colapsada && clientes.filter(c => c.ativo).length > 0 && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 10, color: C.dim, fontWeight: 700, padding: '0 10px', marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Painéis dos Clientes</p>
              {clientes.filter(c => c.ativo).map(c => (
                <a key={c.id} href={c.dominio ? `https://${c.dominio}/admin` : '/admin'} target="_blank"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, fontSize: 12, color: C.dim, textDecoration: 'none' }}>
                  <span style={{ width: 6, height: 6, background: '#22c55e', borderRadius: '50%', flexShrink: 0 }} />
                  {c.nome.split('—')[0].trim()}
                </a>
              ))}
            </div>
          )}
        </nav>

        <div style={{ padding: colapsada ? '12px 8px' : '12px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 8, alignItems: colapsada ? 'center' : 'stretch' }}>
          {!colapsada && <p style={{ fontSize: 11, color: C.dim, margin: 0 }}>{nome}</p>}
          <button onClick={sair} title={colapsada ? 'Sair' : undefined} style={{ ...btnGhost, display: 'flex', alignItems: 'center', gap: 8, justifyContent: colapsada ? 'center' : 'flex-start', padding: '8px 10px' }}>
            {Icons.logout}
            {!colapsada && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: isMobile ? '64px 16px 40px' : '32px', overflow: 'auto', minWidth: 0 }}>

        {/* ── Dashboard ── */}
        {aba === 'dashboard' && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em' }}>Dashboard</h1>
              <p style={{ color: C.dim, fontSize: 13 }}>Visão geral da plataforma</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'FREE', valor: stats.totalAlunos },
                { label: 'PRO', valor: stats.totalGestores },
                { label: 'Admins', valor: stats.totalAdmins },
                { label: 'Módulos', valor: stats.totalModulos },
                { label: 'Aulas', valor: stats.totalAulas },
              ].map(s => (
                <div key={s.label} style={{ ...card, padding: '16px 20px' }}>
                  <p style={{ fontSize: 26, fontWeight: 700, marginBottom: 2, letterSpacing: '-0.02em', color: C.text }}>{s.valor}</p>
                  <p style={{ fontSize: 12, color: C.dim }}>{s.label}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ ...card, padding: '20px 24px' }}>
                <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 16, color: C.text }}>Clientes Ativos</p>
                {clientes.filter(c => c.ativo).map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{c.nome}</p>
                      {c.dominio && <p style={{ fontSize: 11, color: C.dim }}>{c.dominio}</p>}
                    </div>
                    <span style={{ background: `${C.accent}18`, color: C.accent, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>Ativo</span>
                  </div>
                ))}
                {clientes.filter(c => c.ativo).length === 0 && <p style={{ color: C.dim, fontSize: 13 }}>Nenhum cliente ativo.</p>}
              </div>

              <div style={{ ...card, padding: '20px 24px' }}>
                <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 16, color: C.text }}>Últimos Consultores</p>
                {recentesAlunos.map((a, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{a.nome}</p>
                      <p style={{ fontSize: 11, color: C.dim }}>{a.created_at ? new Date(a.created_at).toLocaleDateString('pt-BR') : '—'}</p>
                    </div>
                    <span style={{ background: a.status === 'ativo' ? '#052e16' : `${C.border}80`, color: a.status === 'ativo' ? '#4ade80' : C.dim, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Testar ── */}
        {aba === 'testar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em' }}>Testar Plataforma</h1>
              <p style={{ color: C.dim, fontSize: 13 }}>Acesse cada painel para testar antes de liberar atualizações</p>
            </div>

            <div style={{ ...card, padding: 24 }}>
              <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 16, color: C.text }}>Links Rápidos — Domínio Principal</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { label: 'Admin', link: `${BASE_URL}/admin`, color: C.accent },
                  { label: 'PRO', link: `${BASE_URL}/gestor`, color: '#f59e0b' },
                  { label: 'Captação', link: `${BASE_URL}/captacao`, color: '#22c55e' },
                  { label: 'Login', link: `${BASE_URL}/login`, color: C.dim },
                ].map(p => (
                  <a key={p.label} href={p.link} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `${p.color}10`, border: `1px solid ${p.color}30`, borderRadius: 8, padding: '12px 14px', textDecoration: 'none' }}>
                    <span style={{ color: p.color, fontWeight: 600, fontSize: 13 }}>{p.label}</span>
                    <span style={{ color: p.color, opacity: 0.7 }}>{Icons.external}</span>
                  </a>
                ))}
              </div>
            </div>

            <div style={{ ...card, padding: 24, borderColor: '#166534' }}>
              <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: C.text }}>Experiência do Consultor</p>
              <p style={{ color: C.dim, fontSize: 12, marginBottom: 16 }}>Entre com uma conta de consultor para ver o que ele vê.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href={`${BASE_URL}/login`} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#080810', borderRadius: 8, padding: '10px 14px', textDecoration: 'none' }}>
                  <span style={{ color: C.text, fontWeight: 500, fontSize: 13 }}>Oito7 Digital</span>
                  <span style={{ color: '#22c55e', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>Consultor {Icons.external}</span>
                </a>
                {clientes.filter(c => c.ativo && c.dominio).map(c => (
                  <a key={c.id} href={`https://${c.dominio}/login`} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#080810', borderRadius: 8, padding: '10px 14px', textDecoration: 'none' }}>
                    <span style={{ color: C.text, fontWeight: 500, fontSize: 13 }}>{c.nome}</span>
                    <span style={{ color: '#22c55e', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>Consultor {Icons.external}</span>
                  </a>
                ))}
              </div>
            </div>

            {clientes.filter(c => c.ativo).length > 0 && (
              <div style={{ ...card, padding: 24 }}>
                <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 16, color: C.text }}>Testar por Empresa Cliente</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {clientes.filter(c => c.ativo).map(c => {
                    const url = c.dominio ? `https://${c.dominio}` : BASE_URL
                    return (
                      <div key={c.id} style={{ background: '#080810', borderRadius: 8, padding: '12px 16px' }}>
                        <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{c.nome}</p>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {[
                            { label: 'Admin', link: `${url}/admin` },
                            { label: 'PRO', link: `${url}/gestor` },
                            { label: 'Captação', link: `${url}/captacao` },
                            { label: 'Login', link: `${url}/login` },
                          ].map(btn => (
                            <a key={btn.label} href={btn.link} target="_blank" rel="noreferrer"
                              style={{ background: C.card, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                              {btn.label} {Icons.external}
                            </a>
                          ))}
                        </div>
                        {c.dominio && <p style={{ fontSize: 11, color: C.dim, marginTop: 8 }}>{c.dominio}</p>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Clientes ── */}
        {aba === 'clientes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em' }}>Clientes <span style={{ fontSize: 14, color: C.dim, fontWeight: 400 }}>({clientes.length})</span></h1>
                <p style={{ color: C.dim, fontSize: 13 }}>Empresas e líderes na plataforma</p>
              </div>
              <button onClick={() => setAba('novo')} style={btn}>+ Novo Cliente</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {clientes.map(c => (
                <div key={c.id} style={{ ...card, padding: '16px 20px', opacity: c.ativo ? 1 : 0.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{c.nome}</p>
                        {getTipoCliente(c) === 'lideranca' ? (
                          <span style={{ background: '#3d1c00', border: '1px solid #78350f', color: '#fbbf24', borderRadius: 4, padding: '1px 8px', fontSize: 11, fontWeight: 600 }}>Liderança</span>
                        ) : (
                          <span style={{ background: '#0d0d1f', border: `1px solid ${C.accent}40`, color: '#818cf8', borderRadius: 4, padding: '1px 8px', fontSize: 11, fontWeight: 600 }}>Associação</span>
                        )}
                        {c.gestor_ativo && <span style={{ background: '#052e16', border: '1px solid #166534', color: '#4ade80', borderRadius: 4, padding: '1px 8px', fontSize: 11, fontWeight: 600 }}>+ PRO</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.dim, flexWrap: 'wrap' }}>
                        {c.dominio && <span>{c.dominio}</span>}
                        {c.contato_nome && <span>{c.contato_nome}</span>}
                        {c.contato_whatsapp && <span>{c.contato_whatsapp}</span>}
                        {c.contato_email && <span>{c.contato_email}</span>}
                      </div>
                      {getObsLimpa(c) && <p style={{ fontSize: 11, color: C.dim, marginTop: 6 }}>{getObsLimpa(c)}</p>}
                      <p style={{ fontSize: 11, color: `${C.dim}80`, marginTop: 4 }}>Desde {c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : '—'}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                      <button onClick={() => { setOnboardingId(c.id); setOnboardingForm({ admin_email: c.contato_email || '', admin_nome: c.contato_nome || '', admin_senha: '', dominio: c.dominio || '' }); setOnboardingMsg([]) }}
                        style={{ ...btn, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', fontSize: 12 }}>
                        {Icons.rocket} Onboarding
                      </button>
                      <button onClick={() => iniciarEdicao(c)} style={{ ...btnGhost, fontSize: 12, padding: '7px 12px' }}>Editar</button>
                      <button onClick={() => toggleAtivo(c)} style={{ background: 'none', border: `1px solid ${C.border}`, color: c.ativo ? '#fbbf24' : '#4ade80', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 12 }}>
                        {c.ativo ? 'Suspender' : 'Reativar'}
                      </button>
                      <button onClick={() => excluirCliente(c)} style={{ background: 'none', border: '1px solid #3f1515', color: '#f87171', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 12 }}>
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Novo Cliente ── */}
        {aba === 'novo' && (
          <div style={{ maxWidth: 620 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em' }}>{editando ? 'Editar Cliente' : 'Cadastrar'}</h1>
            <p style={{ color: C.dim, fontSize: 13, marginBottom: 28 }}>O que deseja cadastrar na plataforma?</p>

            {!editando && !tipoNovo && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 32 }}>
                {[
                  { tipo: 'empresa' as const, label: 'Associação', desc: 'Empresa ou associação cliente — tem admin próprio, cria conteúdo para todos os membros' },
                  { tipo: 'lideranca' as const, label: 'Painel Liderança', desc: 'Líder independente que cria treinamentos para sua equipe sem precisar de uma associação' },
                  { tipo: 'gestor' as const, label: 'Usuário PRO', desc: 'PRO vinculado a uma associação já cadastrada — cadastre pelo painel admin dela' },
                  { tipo: 'consultor' as const, label: 'Usuário FREE', desc: 'FREE vinculado a uma associação já cadastrada — cadastre pelo painel admin dela' },
                ].map(({ tipo, label, desc }) => (
                  <button key={tipo} onClick={() => setTipoNovo(tipo)}
                    style={{ ...card, padding: '22px 18px', cursor: 'pointer', textAlign: 'left', border: `1px solid ${C.border}`, transition: 'border-color 0.15s' }}
                    onMouseOver={e => (e.currentTarget.style.borderColor = C.accent)}
                    onMouseOut={e => (e.currentTarget.style.borderColor = C.border)}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 6 }}>{label}</p>
                    <p style={{ fontSize: 12, color: C.dim, lineHeight: 1.5 }}>{desc}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Formulário Associação */}
            {(tipoNovo === 'empresa' || editando) && (
              <div style={{ ...card, padding: '24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {!editando && (
                  <button onClick={() => setTipoNovo('')} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {Icons.chevronLeft} Voltar
                  </button>
                )}
                <div><label style={lbl}>Nome da empresa *</label><input style={inp} value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Auto Vale Prevenções — Uni AVP" /></div>
                <div><label style={lbl}>Domínio personalizado</label><input style={inp} value={form.dominio} onChange={e => setForm(p => ({ ...p, dominio: e.target.value }))} placeholder="uni.empresa.com.br" /></div>
                <div style={{ background: '#080810', borderRadius: 8, padding: '14px 16px' }}>
                  <p style={{ fontSize: 11, color: C.dim, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recursos contratados</p>
                  <div style={{ background: C.card, borderRadius: 7, padding: '10px 12px', marginBottom: 8 }}>
                    <p style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>Plano Completo</p>
                    <p style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>Admin ilimitado · Módulos · Aulas · Quiz · Ranking · Artes</p>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: C.card, borderRadius: 7, padding: '10px 12px' }}>
                    <input type="checkbox" checked={form.gestor_ativo} onChange={e => setForm(p => ({ ...p, gestor_ativo: e.target.checked }))} style={{ width: 16, height: 16, accentColor: C.accent, flexShrink: 0 }} />
                    <div>
                      <p style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>Painel PRO <span style={{ color: '#fbbf24', fontSize: 11, fontWeight: 500 }}>(add-on)</span></p>
                      <p style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>A empresa cadastra seus próprios PROs</p>
                    </div>
                  </label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={lbl}>Nome do contato</label><input style={inp} value={form.contato_nome} onChange={e => setForm(p => ({ ...p, contato_nome: e.target.value }))} /></div>
                  <div><label style={lbl}>WhatsApp</label><input style={inp} value={form.contato_whatsapp} onChange={e => setForm(p => ({ ...p, contato_whatsapp: e.target.value }))} /></div>
                </div>
                <div><label style={lbl}>E-mail</label><input style={inp} value={form.contato_email} onChange={e => setForm(p => ({ ...p, contato_email: e.target.value }))} /></div>
                <div><label style={lbl}>Observações</label><textarea style={{ ...inp, minHeight: 70, resize: 'vertical' } as React.CSSProperties} value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} /></div>
                {msg && <p style={{ fontSize: 13, color: msg.includes('Erro') ? '#f87171' : '#4ade80' }}>{msg}</p>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={salvarCliente} disabled={salvando} style={{ ...btn, flex: 1, opacity: salvando ? 0.6 : 1 }}>
                    {salvando ? 'Salvando...' : editando ? 'Atualizar' : 'Cadastrar Associação'}
                  </button>
                  <button onClick={() => { setAba('clientes'); setEditando(null); setTipoNovo('') }} style={btnGhost}>Cancelar</button>
                </div>
              </div>
            )}

            {/* Painel Liderança */}
            {tipoNovo === 'lideranca' && !editando && (
              <div style={{ ...card, padding: '24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <button onClick={() => setTipoNovo('')} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {Icons.chevronLeft} Voltar
                </button>
                <div style={{ background: '#3d1c0015', border: '1px solid #78350f40', borderRadius: 8, padding: '12px 16px' }}>
                  <p style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700, marginBottom: 4 }}>Painel Liderança</p>
                  <p style={{ fontSize: 12, color: C.dim, lineHeight: 1.5 }}>
                    Para líderes que querem criar treinamentos e gerenciar sua equipe — sem precisar que a associação deles assine a plataforma.
                  </p>
                </div>
                <div><label style={lbl}>Nome do líder *</label><input style={inp} value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="João Silva" /></div>
                <div><label style={lbl}>Domínio personalizado <span style={{ fontWeight: 400, textTransform: 'none', color: C.dim }}>(opcional)</span></label><input style={inp} value={form.dominio} onChange={e => setForm(p => ({ ...p, dominio: e.target.value }))} placeholder="equipe.joaosilva.com.br" /></div>
                <div style={{ background: '#080810', borderRadius: 8, padding: '14px 16px' }}>
                  <p style={{ fontSize: 11, color: C.dim, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Incluído</p>
                  {['Painel admin para criar módulos e aulas', 'Área FREE para os membros da equipe', 'Contratos digitais', 'Ranking, quiz e certificados'].map(r => (
                    <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.card, borderRadius: 7, padding: '8px 12px', marginBottom: 6 }}>
                      <span style={{ color: C.accent, flexShrink: 0 }}>{Icons.check}</span>
                      <p style={{ fontSize: 12, color: C.muted }}>{r}</p>
                    </div>
                  ))}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: C.card, borderRadius: 7, padding: '10px 12px', marginTop: 4 }}>
                    <input type="checkbox" checked={form.gestor_ativo} onChange={e => setForm(p => ({ ...p, gestor_ativo: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#f59e0b', flexShrink: 0 }} />
                    <div>
                      <p style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>Habilitar Painel PRO <span style={{ color: '#fbbf24', fontSize: 11 }}>(add-on)</span></p>
                      <p style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>Permite criar sub-líderes PRO com equipes próprias</p>
                    </div>
                  </label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={lbl}>WhatsApp *</label><input style={inp} value={form.contato_whatsapp} onChange={e => setForm(p => ({ ...p, contato_whatsapp: e.target.value }))} placeholder="(xx) xxxxx-xxxx" /></div>
                  <div><label style={lbl}>E-mail *</label><input style={inp} value={form.contato_email} onChange={e => setForm(p => ({ ...p, contato_email: e.target.value }))} placeholder="lider@email.com" /></div>
                </div>
                <div><label style={lbl}>Observações internas</label><textarea style={{ ...inp, minHeight: 60, resize: 'vertical' } as React.CSSProperties} value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} placeholder="Notas internas..." /></div>
                {msg && <p style={{ fontSize: 13, color: msg.includes('Erro') ? '#f87171' : '#4ade80' }}>{msg}</p>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => {
                    setForm(p => ({ ...p, contato_nome: p.nome, observacoes: JSON.stringify({ _tipo: 'lideranca', obs: p.observacoes }) }))
                    setTimeout(salvarCliente, 0)
                  }} disabled={salvando} style={{ ...btn, flex: 1, background: '#92400e', opacity: salvando ? 0.6 : 1 }}>
                    {salvando ? 'Salvando...' : 'Cadastrar Painel Liderança'}
                  </button>
                  <button onClick={() => { setAba('clientes'); setTipoNovo('') }} style={btnGhost}>Cancelar</button>
                </div>
              </div>
            )}

            {/* PRO */}
            {tipoNovo === 'gestor' && (
              <div style={{ ...card, padding: 24 }}>
                <button onClick={() => setTipoNovo('')} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {Icons.chevronLeft} Voltar
                </button>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Cadastrar PRO</h2>
                <p style={{ color: C.dim, fontSize: 13, marginBottom: 20 }}>PROs são cadastrados pelo painel Admin de cada empresa cliente.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {clientes.filter(c => c.ativo).map(c => (
                    <a key={c.id} href={`${c.dominio ? `https://${c.dominio}` : BASE_URL}/admin/gestores`} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#080810', borderRadius: 8, padding: '10px 14px', textDecoration: 'none', color: C.text }}>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{c.nome}</span>
                      <span style={{ fontSize: 12, color: C.accent, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>Abrir Admin {Icons.external}</span>
                    </a>
                  ))}
                  {clientes.filter(c => c.ativo).length === 0 && <p style={{ color: C.dim, fontSize: 13 }}>Nenhuma empresa ativa.</p>}
                </div>
              </div>
            )}

            {/* FREE */}
            {tipoNovo === 'consultor' && (
              <div style={{ ...card, padding: 24 }}>
                <button onClick={() => setTipoNovo('')} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {Icons.chevronLeft} Voltar
                </button>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Cadastrar FREE</h2>
                <p style={{ color: C.dim, fontSize: 13, marginBottom: 20 }}>Consultores são cadastrados pelo painel Admin de cada empresa cliente.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {clientes.filter(c => c.ativo).map(c => (
                    <a key={c.id} href={`${c.dominio ? `https://${c.dominio}` : BASE_URL}/admin/consultores`} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#080810', borderRadius: 8, padding: '10px 14px', textDecoration: 'none', color: C.text }}>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{c.nome}</span>
                      <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>Abrir Admin {Icons.external}</span>
                    </a>
                  ))}
                  {clientes.filter(c => c.ativo).length === 0 && <p style={{ color: C.dim, fontSize: 13 }}>Nenhuma empresa ativa.</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Planos / Vendas ── */}
        {aba === 'planos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em' }}>Planos e Vendas</h1>
                <p style={{ color: C.dim, fontSize: 13 }}>Configure os planos exibidos na página de vendas</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href="/landing" target="_blank" rel="noreferrer" style={{ ...btnGhost, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                  Página de vendas {Icons.external}
                </a>
                <a href="/comecar" target="_blank" rel="noreferrer" style={{ ...btnGhost, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                  Cadastro {Icons.external}
                </a>
                <button onClick={salvarPlanos} disabled={salvandoPlanos} style={{ ...btn, opacity: salvandoPlanos ? 0.6 : 1, cursor: salvandoPlanos ? 'not-allowed' : 'pointer' }}>
                  {salvandoPlanos ? 'Salvando...' : 'Salvar planos'}
                </button>
              </div>
            </div>

            {msgPlanos && (
              <div style={{ background: msgPlanos.includes('sucesso') ? '#052e16' : '#1a0a0a', border: `1px solid ${msgPlanos.includes('sucesso') ? '#166534' : '#3f1515'}`, borderRadius: 8, padding: '10px 16px', color: msgPlanos.includes('sucesso') ? '#4ade80' : '#f87171', fontSize: 13, marginBottom: 20 }}>
                {msgPlanos}
              </div>
            )}

            {/* Configurações da landing */}
            <div style={{ ...card, padding: '20px 24px', marginBottom: 20 }}>
              <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 16, color: C.text }}>Configurações da página de vendas</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { chave: 'landing_nome_plataforma', label: 'Nome da plataforma', placeholder: 'Plataforma EAD White-Label' },
                  { chave: 'landing_whatsapp_contato', label: 'WhatsApp de contato', placeholder: '5511999999999' },
                ].map(f => (
                  <div key={f.chave}>
                    <label style={lbl}>{f.label}</label>
                    <input style={inp} placeholder={f.placeholder} defaultValue={configs.find(c => c.chave === f.chave)?.valor || ''}
                      onBlur={async e => {
                        await fetch('/api/admin/configuracoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chave: f.chave, valor: e.target.value }) })
                      }} />
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={lbl}>Descrição do hero</label>
                  <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' } as React.CSSProperties}
                    placeholder="Sua associação com treinamentos, contratos e gestão em um único lugar..."
                    defaultValue={configs.find(c => c.chave === 'landing_descricao')?.valor || ''}
                    onBlur={async e => {
                      await fetch('/api/admin/configuracoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chave: 'landing_descricao', valor: e.target.value }) })
                    }} />
                </div>
              </div>
            </div>

            {/* Cards dos planos */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {planos.map(p => (
                <div key={p.id} style={{ ...card, padding: '20px', opacity: p.ativo ? 1 : 0.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{p.nome}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => setEditandoPlano(editandoPlano === p.id ? null : p.id)}
                        style={{ background: editandoPlano === p.id ? `${C.accent}20` : '#080810', border: `1px solid ${editandoPlano === p.id ? C.accent : C.border}`, color: editandoPlano === p.id ? C.accent : C.dim, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                        {editandoPlano === p.id ? 'Fechar' : 'Editar'}
                      </button>
                      <button onClick={() => atualizarPlano(p.id, 'ativo', !p.ativo)}
                        style={{ background: p.ativo ? '#052e16' : '#1a0a0a', border: `1px solid ${p.ativo ? '#166534' : '#3f1515'}`, color: p.ativo ? '#4ade80' : '#f87171', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: p.preco > 0 ? '#818cf8' : C.dim, letterSpacing: '-0.02em' }}>
                      {p.preco > 0 ? `R$ ${p.preco.toLocaleString('pt-BR')}` : (p.preco_label || 'Sob consulta')}
                    </span>
                    {p.preco > 0 && <span style={{ fontSize: 12, color: C.dim }}>/mês</span>}
                  </div>

                  {p.destaque && <span style={{ background: `${C.accent}15`, border: `1px solid ${C.accent}30`, color: '#818cf8', fontSize: 11, fontWeight: 600, borderRadius: 4, padding: '2px 8px', display: 'inline-block', marginBottom: 10 }}>Destaque</span>}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                    {p.recursos.map((r, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: C.accent, flexShrink: 0 }}>{Icons.check}</span>
                        <span style={{ fontSize: 12, color: C.muted, flex: 1 }}>{r}</span>
                        {editandoPlano === p.id && (
                          <button onClick={() => removerRecurso(p.id, i)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 16, padding: '0 2px', flexShrink: 0, lineHeight: 1 }}>×</button>
                        )}
                      </div>
                    ))}
                  </div>

                  {editandoPlano === p.id && (
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div><label style={lbl}>Nome</label><input style={{ ...inp, fontSize: 12 }} value={p.nome} onChange={e => atualizarPlano(p.id, 'nome', e.target.value)} /></div>
                        <div><label style={lbl}>Preço (0 = sob consulta)</label><input style={{ ...inp, fontSize: 12 }} type="number" min={0} step={1} value={p.preco} onChange={e => atualizarPlano(p.id, 'preco', parseFloat(e.target.value) || 0)} /></div>
                      </div>
                      <div><label style={lbl}>Label de preço customizado</label><input style={{ ...inp, fontSize: 12 }} placeholder="A partir de R$ 497" value={p.preco_label || ''} onChange={e => atualizarPlano(p.id, 'preco_label', e.target.value)} /></div>
                      <div><label style={lbl}>Descrição</label><input style={{ ...inp, fontSize: 12 }} value={p.descricao} onChange={e => atualizarPlano(p.id, 'descricao', e.target.value)} /></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div><label style={lbl}>Limite de consultores</label><input style={{ ...inp, fontSize: 12 }} type="number" min={1} value={p.limite_consultores} onChange={e => atualizarPlano(p.id, 'limite_consultores', parseInt(e.target.value) || 100)} /></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 18 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: C.text }}>
                            <input type="checkbox" checked={p.destaque} onChange={e => atualizarPlano(p.id, 'destaque', e.target.checked)} style={{ accentColor: C.accent }} />
                            Plano destaque
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: C.text }}>
                            <input type="checkbox" checked={p.gestor_ativo} onChange={e => atualizarPlano(p.id, 'gestor_ativo', e.target.checked)} style={{ accentColor: '#f59e0b' }} />
                            Inclui Painel PRO
                          </label>
                        </div>
                      </div>
                      <div>
                        <label style={lbl}>Adicionar recurso</label>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input style={{ ...inp, fontSize: 12 }} placeholder="Módulos ilimitados" value={novoRecurso[p.id] || ''}
                            onChange={e => setNovoRecurso(prev => ({ ...prev, [p.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && adicionarRecurso(p.id)} />
                          <button onClick={() => adicionarRecurso(p.id)}
                            style={{ background: C.accent, border: 'none', color: '#fff', borderRadius: 6, padding: '0 14px', cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>+</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, ...card, padding: 16 }}>
              <p style={{ fontWeight: 600, fontSize: 12, color: C.text, marginBottom: 8 }}>Fluxo de vendas</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: C.dim }}>
                <p>A associação acessa <span style={{ color: '#818cf8' }}>/landing</span>, escolhe plano e vai para <span style={{ color: '#818cf8' }}>/comecar</span></p>
                <p>Preenche dados, paga via PIX e recebe credenciais automaticamente no WhatsApp</p>
                <p>Planos com preço 0 mostram "Sob consulta" e redirecionam para o WhatsApp de contato</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Cobranças ── */}
        {aba === 'cobranca' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em' }}>Cobranças</h1>
                <p style={{ color: C.dim, fontSize: 13 }}>Mensalidades e acesso dos clientes</p>
              </div>
              <button
                disabled={registrandoWebhook}
                onClick={async () => {
                  setRegistrandoWebhook(true); setCobrancaMsg('')
                  const res = await fetch('/api/super/webhook-efi', { method: 'POST' })
                  const data = await res.json()
                  setRegistrandoWebhook(false)
                  setCobrancaMsg(res.ok ? `Webhook Efí registrado: ${data.webhookUrl}` : `Erro webhook: ${data.error}`)
                }}
                style={{ ...btnGhost, opacity: registrandoWebhook ? 0.6 : 1, cursor: registrandoWebhook ? 'not-allowed' : 'pointer' }}>
                {registrandoWebhook ? 'Registrando...' : 'Registrar Webhook Efí'}
              </button>
            </div>
            {cobrancaMsg && (
              <div style={{ background: cobrancaMsg.includes('Erro') ? '#1a0a0a' : '#052e16', border: `1px solid ${cobrancaMsg.includes('Erro') ? '#3f1515' : '#166534'}`, borderRadius: 8, padding: '10px 16px', color: cobrancaMsg.includes('Erro') ? '#f87171' : '#4ade80', fontSize: 13, marginBottom: 16 }}>
                {cobrancaMsg}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {clientes.map(c => {
                const statusColor: Record<string, string> = { em_dia: '#4ade80', pendente: '#fbbf24', suspenso: '#f87171', atrasado: '#f87171' }
                const statusBg: Record<string, string> = { em_dia: '#052e16', pendente: '#3d1c00', suspenso: '#1a0a0a', atrasado: '#1a0a0a' }
                const statusLabel: Record<string, string> = { em_dia: 'Em dia', pendente: 'Pendente', suspenso: 'Suspenso', atrasado: 'Atrasado' }
                const st = c.status_pagamento || 'em_dia'
                return (
                  <div key={c.id} style={{ ...card, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{c.nome}</p>
                        <span style={{ background: statusBg[st] || '#080810', color: statusColor[st] || C.dim, borderRadius: 4, padding: '1px 8px', fontSize: 11, fontWeight: 600 }}>
                          {statusLabel[st] || st}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 14, fontSize: 12, color: C.dim }}>
                        <span>R$ {Number(c.mensalidade || 0).toFixed(2).replace('.', ',')}/mês</span>
                        <span>Vence dia {c.vencimento_dia || 10}</span>
                        {c.ultimo_pagamento && <span>Último: {new Date(c.ultimo_pagamento + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="number" placeholder="Mensalidade" min={0} step={0.01}
                        defaultValue={c.mensalidade || ''}
                        onBlur={async e => {
                          const val = parseFloat(e.target.value)
                          if (!isNaN(val)) {
                            await fetch('/api/super/clientes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, mensalidade: val }) })
                            setClientes(prev => prev.map(x => x.id === c.id ? { ...x, mensalidade: val } : x))
                          }
                        }}
                        style={{ width: 110, background: '#080810', border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 10px', color: C.text, fontSize: 13, outline: 'none' }}
                      />
                      <button
                        disabled={gerandoPix === c.id}
                        onClick={async () => {
                          setGerandoPix(c.id); setCobrancaMsg('')
                          const res = await fetch('/api/super/cobranca', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cliente_id: c.id }) })
                          const data = await res.json()
                          setGerandoPix(null)
                          setCobrancaMsg(res.ok ? `PIX gerado para ${c.nome}.` : `Erro: ${data.error}`)
                        }}
                        style={{ background: `${C.accent}18`, border: `1px solid ${C.accent}30`, color: '#818cf8', borderRadius: 7, padding: '7px 12px', cursor: gerandoPix === c.id ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', opacity: gerandoPix === c.id ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {Icons.pix} {gerandoPix === c.id ? 'Gerando...' : 'Gerar PIX'}
                      </button>
                      {st === 'suspenso' && (
                        <button
                          onClick={async () => {
                            await fetch('/api/super/clientes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, ativo: true, status_pagamento: 'em_dia' }) })
                            setClientes(prev => prev.map(x => x.id === c.id ? { ...x, ativo: true, status_pagamento: 'em_dia' } : x))
                            setCobrancaMsg(`${c.nome} reativado.`)
                          }}
                          style={{ background: '#052e16', border: '1px solid #166534', color: '#4ade80', borderRadius: 7, padding: '7px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                          Reativar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
              {clientes.length === 0 && <p style={{ color: C.dim, fontSize: 13 }}>Nenhum cliente cadastrado.</p>}
            </div>
            <div style={{ marginTop: 20, ...card, padding: 16, fontSize: 12, color: C.dim }}>
              <p style={{ fontWeight: 600, color: C.text, marginBottom: 8 }}>Como funciona</p>
              <p>Defina a mensalidade e clique fora para salvar · Clique em Gerar PIX para criar cobrança e enviar por WhatsApp</p>
              <p>O sistema gera cobranças automaticamente 5 dias antes do vencimento e suspende após 3 dias de atraso</p>
              <p style={{ marginTop: 6, color: '#818cf8' }}>Endpoint do webhook: <span style={{ fontFamily: 'monospace' }}>{BASE_URL}/api/webhooks/pix</span></p>
            </div>
          </div>
        )}

        {/* ── Boleto Avulso ── */}
        {aba === 'boleto_avulso' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em' }}>Boleto Avulso</h1>
              <p style={{ color: C.dim, fontSize: 13 }}>Gere um boleto personalizado sem vínculo com mensalidade ou cliente.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
              <div style={{ ...card, padding: '24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ fontWeight: 600, fontSize: 13, color: C.text }}>Dados do boleto</p>
                <div><label style={lbl}>Nome completo *</label><input style={inp} placeholder="João da Silva" value={bAvulso.nome} onChange={e => setBAvulso(v => ({ ...v, nome: e.target.value }))} /></div>
                <div><label style={lbl}>CPF ou CNPJ *</label><input style={inp} placeholder="000.000.000-00" value={bAvulso.cpfCnpj} onChange={e => setBAvulso(v => ({ ...v, cpfCnpj: e.target.value }))} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={lbl}>Valor (R$) *</label><input style={inp} type="number" min="0.01" step="0.01" placeholder="0,00" value={bAvulso.valor} onChange={e => setBAvulso(v => ({ ...v, valor: e.target.value }))} /></div>
                  <div><label style={lbl}>Vencimento *</label><input style={inp} type="date" value={bAvulso.vencimento} onChange={e => setBAvulso(v => ({ ...v, vencimento: e.target.value }))} /></div>
                </div>
                <div><label style={lbl}>Descrição</label><input style={inp} placeholder="Consultoria de marketing" value={bAvulso.descricao} onChange={e => setBAvulso(v => ({ ...v, descricao: e.target.value }))} /></div>
                <div><label style={lbl}>E-mail</label><input style={inp} type="email" placeholder="cliente@email.com" value={bAvulso.email} onChange={e => setBAvulso(v => ({ ...v, email: e.target.value }))} /></div>
                <div>
                  <label style={lbl}>WhatsApp para envio</label>
                  <input style={inp} placeholder="5511999999999" value={bAvulso.whatsapp} onChange={e => setBAvulso(v => ({ ...v, whatsapp: e.target.value }))} />
                  <p style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>Se preenchido, envia o boleto automaticamente</p>
                </div>
                <div><label style={lbl}>Mensagem no boleto</label><input style={inp} placeholder="Usa a padrão se não informar" value={bAvulso.mensagem} onChange={e => setBAvulso(v => ({ ...v, mensagem: e.target.value }))} /></div>
                {bAvulsoMsg && (
                  <div style={{ background: bAvulsoMsg.includes('sucesso') ? '#052e16' : '#1a0a0a', border: `1px solid ${bAvulsoMsg.includes('sucesso') ? '#166534' : '#3f1515'}`, borderRadius: 8, padding: '10px 14px', color: bAvulsoMsg.includes('sucesso') ? '#4ade80' : '#f87171', fontSize: 12 }}>
                    {bAvulsoMsg}
                  </div>
                )}
                <button onClick={gerarBoletoAvulso} disabled={bAvulsoLoading} style={{ ...btn, opacity: bAvulsoLoading ? 0.6 : 1, cursor: bAvulsoLoading ? 'not-allowed' : 'pointer' }}>
                  {bAvulsoLoading ? 'Gerando...' : 'Gerar Boleto'}
                </button>
              </div>

              <div>
                {bAvulsoResultado ? (
                  <div style={{ ...card, padding: '24px', borderColor: '#166534' }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#4ade80', marginBottom: 16 }}>Boleto gerado</p>
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: 11, color: C.dim, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>Código de barras</p>
                      <div style={{ background: '#080810', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, color: C.text, wordBreak: 'break-all', lineHeight: 1.6 }}>
                        {bAvulsoResultado.codigoBarras}
                      </div>
                      <button onClick={() => navigator.clipboard.writeText(bAvulsoResultado.codigoBarras)}
                        style={{ ...btnGhost, marginTop: 8, fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {Icons.copy} Copiar código
                      </button>
                    </div>
                    {bAvulsoResultado.pdfUrl && (
                      <a href={bAvulsoResultado.pdfUrl} target="_blank" rel="noreferrer"
                        style={{ display: 'block', background: `${C.accent}15`, border: `1px solid ${C.accent}30`, color: '#818cf8', borderRadius: 8, padding: '10px', textAlign: 'center', textDecoration: 'none', fontWeight: 600, fontSize: 13, marginBottom: 10 }}>
                        Abrir PDF do Boleto
                      </a>
                    )}
                    <button onClick={() => { setBAvulsoResultado(null); setBAvulsoMsg('') }} style={{ ...btnGhost, width: '100%', marginTop: 4 }}>
                      Gerar novo boleto
                    </button>
                  </div>
                ) : (
                  <div style={{ ...card, padding: '24px' }}>
                    <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: C.text }}>Como funciona</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: C.dim, lineHeight: 1.6 }}>
                      <p>Preencha os dados e clique em Gerar Boleto</p>
                      <p>Emitido pela Efí Pay com a logo configurada no painel deles</p>
                      <p>Se informar o WhatsApp, o código e o PDF são enviados automaticamente</p>
                      <p>Não precisa estar vinculado a nenhum cliente ou assinatura</p>
                      <p>Multa e juros padrão vêm da seção Boleto das Configurações</p>
                    </div>
                    <div style={{ marginTop: 16, background: `${C.accent}10`, border: `1px solid ${C.accent}20`, borderRadius: 8, padding: '12px 14px', fontSize: 12, color: C.dim }}>
                      Logo da empresa no boleto: configure em <span style={{ color: C.text }}>app.efipay.com.br → Personalização</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Configurações ── */}
        {aba === 'configuracoes' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em' }}>Configurações da Plataforma</h1>
              <p style={{ color: C.dim, fontSize: 13 }}>Logos, cores, certificados, carteirinha, boleto.</p>
            </div>
            <ConfiguracoesCliente configs={configs} isMaster={true} />
          </div>
        )}
      </main>

      {/* ── Modal Onboarding ── */}
      {onboardingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={e => e.target === e.currentTarget && setOnboardingId(null)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '28px 32px', width: 500, maxWidth: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Onboarding Automático</h2>
              <button onClick={() => setOnboardingId(null)} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', display: 'flex' }}>{Icons.close}</button>
            </div>
            <p style={{ color: C.dim, fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>O sistema vai criar o admin, configurar os subdomínios e enviar as credenciais por WhatsApp.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Nome do Admin *', key: 'admin_nome', type: 'text', placeholder: 'Nome do responsável' },
                { label: 'E-mail do Admin *', key: 'admin_email', type: 'email', placeholder: 'admin@empresa.com.br' },
                { label: 'Senha inicial *', key: 'admin_senha', type: 'password', placeholder: 'Mín. 8 caracteres' },
                { label: 'Domínio (opcional)', key: 'dominio', type: 'text', placeholder: 'uni.empresa.com.br' },
              ].map(f => (
                <div key={f.key}>
                  <label style={lbl}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={(onboardingForm as any)[f.key]}
                    onChange={e => setOnboardingForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={inp} />
                </div>
              ))}
            </div>
            {onboardingMsg.length > 0 && (
              <div style={{ marginTop: 16, background: '#080810', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {onboardingMsg.map((m, i) => (
                  <p key={i} style={{ fontSize: 12, color: m.startsWith('✅') ? '#4ade80' : m.startsWith('⚠️') ? '#fbbf24' : C.dim, margin: 0 }}>{m}</p>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setOnboardingId(null)} style={btnGhost}>Cancelar</button>
              <button onClick={() => rodarOnboarding(onboardingId)} disabled={onboardingLoading || !onboardingForm.admin_email || !onboardingForm.admin_senha}
                style={{ ...btn, opacity: onboardingLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                {onboardingLoading ? 'Executando...' : <>{Icons.rocket} Executar Onboarding</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
