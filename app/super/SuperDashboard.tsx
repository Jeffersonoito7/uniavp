'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import ConfiguracoesCliente from '@/app/admin/configuracoes/ConfiguracoesCliente'
import { TogglePill } from '@/app/components/TogglePill'

type Cliente = { id: string; nome: string; dominio: string | null; ativo: boolean | null; contato_nome: string | null; contato_whatsapp: string | null; contato_email: string | null; observacoes: string | null; created_at: string | null; gestor_ativo: boolean | null; limite_consultores: number | null; cpf_cnpj?: string | null; sede_mei?: string | null; cnpj_mei?: string | null; mensalidade?: number | null; status_pagamento?: string | null; vencimento_dia?: number | null; pix_txid?: string | null; ultimo_pagamento?: string | null; whatsapp_instancia?: string | null; pro_modo?: string | null; pro_valor?: number | null }
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
  monitor: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  alert: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  bot: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>,
}

export default function SuperDashboard({ nome, clientes: inicial, stats, recentesAlunos, configs }: {
  nome: string; clientes: Cliente[]; stats: Stats; recentesAlunos: { nome: string; created_at: string | null; status: string }[]; configs: Config[]
}) {
  const [clientes, setClientes] = useState<Cliente[]>(inicial)
  const [aba, setAba] = useState<'dashboard' | 'clientes' | 'novo' | 'testar' | 'cobranca' | 'boleto_avulso' | 'configuracoes' | 'planos' | 'implantacao' | 'contratos' | 'monitoramento' | 'agente'>('dashboard')
  const [onboardingId, setOnboardingId] = useState<string | null>(null)
  const [onboardingForm, setOnboardingForm] = useState({ admin_email: '', admin_nome: '', dominio: '', whatsapp_instancia: '' })
  const [onboardingMsg, setOnboardingMsg] = useState<string[]>([])
  const [onboardingLoading, setOnboardingLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const [colapsada, setColapsada] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('super_theme') === 'dark'
    return false
  })
  useEffect(() => { localStorage.setItem('super_theme', darkMode ? 'dark' : 'light') }, [darkMode])
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
  const [healthData, setHealthData] = useState<any>(null)
  const [healthLoading, setHealthLoading] = useState(false)

  // Agente IA
  type AgenteConfigGlobal = { nome_assistente: string; prompt_base: string | null; modelo_padrao: string; creditos_boas_vindas_padrao: number; ativo: boolean }
  type AgenteTenantRow = { id: string; nome: string; dominio: string | null; config: { nome_assistente: string; instancia_whatsapp: string | null; modelo: string; ativo: boolean } | null; stats: { creditos_total: number; creditos_consumidos: number; receita_total: number; gestores_com_saldo: number } }
  const [agenteData, setAgenteData] = useState<{ configGlobal: AgenteConfigGlobal | null; tenants: AgenteTenantRow[] } | null>(null)
  const [agenteLoading, setAgenteLoading] = useState(false)
  const [agenteForm, setAgenteForm] = useState<AgenteConfigGlobal>({ nome_assistente: 'Assistente AutoVale', prompt_base: null, modelo_padrao: 'haiku', creditos_boas_vindas_padrao: 50, ativo: true })
  const [agenteSalvando, setAgenteSalvando] = useState(false)
  const [agenteMsg, setAgenteMsg] = useState('')
  const [agenteTenantSel, setAgenteTenantSel] = useState<string | null>(null)
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

  useEffect(() => {
    if (aba === 'agente' && !agenteData) {
      setAgenteLoading(true)
      fetch('/api/super/agente').then(r => r.json()).then(data => {
        setAgenteData(data)
        if (data.configGlobal) setAgenteForm(data.configGlobal)
        setAgenteLoading(false)
      }).catch(() => setAgenteLoading(false))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba])

  async function salvarAgenteConfig() {
    setAgenteSalvando(true); setAgenteMsg('')
    const res = await fetch('/api/super/agente', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(agenteForm) })
    setAgenteSalvando(false)
    setAgenteMsg(res.ok ? 'Configuracao salva com sucesso.' : 'Erro ao salvar configuracao.')
    if (res.ok) setAgenteData(prev => prev ? { ...prev, configGlobal: { ...agenteForm } } : prev)
    setTimeout(() => setAgenteMsg(''), 3000)
  }

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

  function valorPorExtenso(v: number): string {
    if (!v || isNaN(v)) return 'valor a definir'
    const partes = v.toFixed(2).split('.')
    const reais = parseInt(partes[0])
    const centavos = parseInt(partes[1])
    const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
    const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
    const centenas = ['', 'cem', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']
    function num(n: number): string {
      if (n === 0) return ''
      if (n < 20) return unidades[n]
      if (n < 100) return dezenas[Math.floor(n / 10)] + (n % 10 ? ' e ' + unidades[n % 10] : '')
      if (n === 100) return 'cem'
      return centenas[Math.floor(n / 100)] + (n % 100 ? ' e ' + num(n % 100) : '')
    }
    let texto = ''
    if (reais >= 1000) texto = num(Math.floor(reais / 1000)) + ' mil' + (reais % 1000 ? ' e ' + num(reais % 1000) : '')
    else texto = num(reais)
    texto = texto ? texto + (reais === 1 ? ' real' : ' reais') : ''
    if (centavos > 0) texto += (texto ? ' e ' : '') + num(centavos) + (centavos === 1 ? ' centavo' : ' centavos')
    return texto || 'zero reais'
  }

  function porExtensoMeses(m: number): string {
    const meses = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze']
    return meses[m] || String(m)
  }

  // Shared styles
  const C = {
    bg:     darkMode ? '#0a0a0f'  : '#f1f5f9',
    card:   darkMode ? '#0f0f17'  : '#ffffff',
    border: darkMode ? '#1e1f2e'  : '#e2e8f0',
    accent: '#4f46e5',
    text:   darkMode ? '#f1f5f9'  : '#0f172a',
    dim:    darkMode ? '#64748b'  : '#64748b',
    muted:  darkMode ? '#94a3b8'  : '#94a3b8',
  }
  const inp: React.CSSProperties = { width: '100%', background: darkMode ? '#080810' : '#f8fafc', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', color: C.muted, fontSize: 11, fontWeight: 700, marginBottom: 5, letterSpacing: '0.04em', textTransform: 'uppercase' }
  const card: React.CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 10 }
  const btn: React.CSSProperties = { background: C.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', letterSpacing: '0.01em' }
  const btnGhost: React.CSSProperties = { background: 'none', border: `1px solid ${C.border}`, color: C.dim, borderRadius: 8, padding: '9px 16px', fontWeight: 500, fontSize: 13, cursor: 'pointer' }

  // ── Estado para contratos ──────────────────────────────────────────
  const contratoDefault = {
    empresa_nome: 'Oito7 Digital Ltda', empresa_cnpj: '', empresa_endereco: '', empresa_responsavel: 'Jefferson Soares',
    cliente_nome: '', cliente_cnpj: '', cliente_endereco: '', cliente_responsavel: '',
    valor_implantacao: '', valor_mensalidade: '', data: new Date().toLocaleDateString('pt-BR'),
    servicos: 'Plataforma EAD white-label com módulos, aulas, quiz, certificados, contratos digitais, ranking e gamificação, painel admin, área FREE e área PRO.',
    prazo_meses: '12', cidade: 'Fortaleza – CE',
  }
  const [contratoForm, setContratoForm] = useState(contratoDefault)
  const [contratoVer, setContratoVer] = useState(false)

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.dashboard },
    { id: 'monitoramento', label: 'Monitoramento', icon: Icons.monitor },
    { id: 'clientes', label: 'Clientes', icon: Icons.clients },
    { id: 'novo', label: 'Novo Cliente', icon: Icons.plus },
    { id: 'implantacao', label: 'Guia de Implantação', icon: Icons.rocket },
    { id: 'contratos', label: 'Contratos', icon: Icons.invoice },
    { id: 'planos', label: 'Planos / Vendas', icon: Icons.plans },
    { id: 'testar', label: 'Testar', icon: Icons.test },
    { id: 'boleto_avulso', label: 'Boleto Avulso', icon: Icons.invoice },
    { id: 'agente', label: 'Agente IA', icon: Icons.bot },
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
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = darkMode ? '#ffffff10' : '#e2e8f0' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                style={{ display: 'flex', alignItems: 'center', gap: colapsada ? 0 : 10, justifyContent: colapsada ? 'center' : 'flex-start', padding: colapsada ? '10px 0' : '9px 10px', borderRadius: 7, fontSize: 13, fontWeight: active ? 600 : 400, color: active ? C.text : C.dim, background: active ? `${C.accent}18` : 'transparent', border: active ? `1px solid ${C.accent}30` : '1px solid transparent', cursor: 'pointer', textAlign: 'left', width: '100%', whiteSpace: 'nowrap', transition: 'background 0.1s' }}>
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

        <div style={{ padding: colapsada ? '8px 8px' : '8px 12px', borderTop: `1px solid ${C.border}` }}>
          <a href="/manual.html" target="_blank" rel="noreferrer" title="Manual da Plataforma"
            style={{ display: 'flex', alignItems: 'center', gap: colapsada ? 0 : 8, justifyContent: colapsada ? 'center' : 'flex-start', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', borderRadius: 7, padding: colapsada ? '8px 0' : '7px 12px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            {!colapsada && <span>Manual da Plataforma</span>}
          </a>
        </div>

        <div style={{ padding: colapsada ? '12px 8px' : '12px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 8, alignItems: colapsada ? 'center' : 'stretch' }}>
          {!colapsada && <p style={{ fontSize: 11, color: C.dim, margin: 0 }}>{nome}</p>}
          <button onClick={() => setDarkMode(d => !d)} title={darkMode ? 'Modo claro' : 'Modo escuro'} style={{ ...btnGhost, display: 'flex', alignItems: 'center', gap: 8, justifyContent: colapsada ? 'center' : 'flex-start', padding: '8px 10px' }}>
            {darkMode
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
            {!colapsada && <span>{darkMode ? 'Modo claro' : 'Modo escuro'}</span>}
          </button>
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
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: darkMode ? '#080810' : '#f8fafc', borderRadius: 8, padding: '10px 14px', textDecoration: 'none' }}>
                  <span style={{ color: C.text, fontWeight: 500, fontSize: 13 }}>Oito7 Digital</span>
                  <span style={{ color: '#22c55e', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>Consultor {Icons.external}</span>
                </a>
                {clientes.filter(c => c.ativo && c.dominio).map(c => (
                  <a key={c.id} href={`https://${c.dominio}/login`} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: darkMode ? '#080810' : '#f8fafc', borderRadius: 8, padding: '10px 14px', textDecoration: 'none' }}>
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
                      <div key={c.id} style={{ background: darkMode ? '#080810' : '#f8fafc', borderRadius: 8, padding: '12px 16px' }}>
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
                      <button onClick={() => { setOnboardingId(c.id); setOnboardingForm({ admin_email: c.contato_email || '', admin_nome: c.contato_nome || '', dominio: c.dominio || '', whatsapp_instancia: c.whatsapp_instancia || '' }); setOnboardingMsg([]) }}
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
                <div style={{ background: darkMode ? '#080810' : '#f8fafc', borderRadius: 8, padding: '14px 16px' }}>
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
                <div style={{ background: darkMode ? '#080810' : '#f8fafc', borderRadius: 8, padding: '14px 16px' }}>
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
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: darkMode ? '#080810' : '#f8fafc', borderRadius: 8, padding: '10px 14px', textDecoration: 'none', color: C.text }}>
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
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: darkMode ? '#080810' : '#f8fafc', borderRadius: 8, padding: '10px 14px', textDecoration: 'none', color: C.text }}>
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
                            <input type="checkbox" checked={p.destaque} onChange={e => atualizarPlano(p.id, 'destaque', e.target.checked)} style={{ display: 'none' }} />
                            <TogglePill checked={p.destaque} />
                            Plano destaque
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: C.text }}>
                            <input type="checkbox" checked={p.gestor_ativo} onChange={e => atualizarPlano(p.id, 'gestor_ativo', e.target.checked)} style={{ display: 'none' }} />
                            <TogglePill checked={p.gestor_ativo} />
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
                      <select
                        defaultValue={c.pro_modo || 'individual'}
                        onChange={async e => {
                          const modo = e.target.value
                          await fetch('/api/super/tenant-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenant_id: c.id, chave: 'pro_cobranca_modo', valor: modo }) })
                          setClientes(prev => prev.map(x => x.id === c.id ? { ...x, pro_modo: modo } : x))
                        }}
                        style={{ background: darkMode ? '#080810' : '#f8fafc', border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 10px', color: C.text, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                        <option value="individual">PRO paga individual</option>
                        <option value="incluso">PRO incluso no plano</option>
                        <option value="ganho">PRO por rede (gratuito)</option>
                      </select>
                      <input
                        type="number" placeholder="Valor PRO (R$)" min={0} step={0.01}
                        defaultValue={c.pro_valor || ''}
                        onBlur={async e => {
                          const val = parseFloat(e.target.value)
                          if (!isNaN(val) && val >= 0) {
                            await fetch('/api/super/tenant-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenant_id: c.id, chave: 'plano_pro_valor', valor: val }) })
                            setClientes(prev => prev.map(x => x.id === c.id ? { ...x, pro_valor: val } : x))
                          }
                        }}
                        style={{ width: 120, background: darkMode ? '#080810' : '#f8fafc', border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 10px', color: C.text, fontSize: 13, outline: 'none' }}
                      />
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
                        style={{ width: 110, background: darkMode ? '#080810' : '#f8fafc', border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 10px', color: C.text, fontSize: 13, outline: 'none' }}
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
              <p>Defina a mensalidade da associação e o valor PRO e clique fora para salvar · Clique em Gerar PIX para criar cobrança e enviar por WhatsApp</p>
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
                      <div style={{ background: darkMode ? '#080810' : '#f8fafc', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, color: C.text, wordBreak: 'break-all', lineHeight: 1.6 }}>
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

        {/* ── Monitoramento ── */}
        {aba === 'monitoramento' && (
          <div style={{ maxWidth: 860 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em' }}>Monitoramento</h1>
                <p style={{ color: C.dim, fontSize: 13 }}>Saúde da plataforma, consumo e previsões de risco</p>
              </div>
              <button
                onClick={async () => {
                  setHealthLoading(true)
                  const res = await fetch('/api/super/health')
                  if (res.ok) setHealthData(await res.json())
                  setHealthLoading(false)
                }}
                style={{ background: `${C.accent}18`, border: `1px solid ${C.accent}30`, color: '#818cf8', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {healthLoading ? 'Analisando...' : '↻ Atualizar'}
              </button>
            </div>

            {!healthData && !healthLoading && (
              <div style={{ ...card, padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                <p style={{ color: C.text, fontWeight: 600, marginBottom: 6 }}>Análise sob demanda</p>
                <p style={{ color: C.dim, fontSize: 13, marginBottom: 20 }}>Clique em Atualizar para rodar a análise completa da plataforma</p>
                <button
                  onClick={async () => {
                    setHealthLoading(true)
                    const res = await fetch('/api/super/health')
                    if (res.ok) setHealthData(await res.json())
                    setHealthLoading(false)
                  }}
                  style={{ background: C.accent, border: 'none', color: '#fff', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                  Analisar agora
                </button>
              </div>
            )}

            {healthLoading && (
              <div style={{ ...card, padding: 40, textAlign: 'center', color: C.dim }}>
                <p style={{ fontSize: 14 }}>Consultando banco de dados...</p>
              </div>
            )}

            {healthData && !healthLoading && (() => {
              const { metricas: m, previsao: p, alertas } = healthData
              const nivelCor: Record<string, string> = { critico: '#f87171', aviso: '#fbbf24', info: '#818cf8' }
              const nivelBg: Record<string, string>  = { critico: '#1a0a0a', aviso: '#3d1c00', info: '#0d0f1e' }
              const nivelBorder: Record<string, string> = { critico: '#3f1515', aviso: '#78350f', info: '#2d3270' }
              const nivelEmoji: Record<string, string> = { critico: '🔴', aviso: '🟡', info: '🔵' }

              return (
                <>
                  {/* Alertas */}
                  {alertas.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Alertas</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {alertas.map((a: any, i: number) => (
                          <div key={i} style={{ ...card, padding: '14px 18px', borderColor: nivelBorder[a.nivel], background: nivelBg[a.nivel] }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{nivelEmoji[a.nivel]}</span>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 700, fontSize: 13, color: nivelCor[a.nivel], marginBottom: 3 }}>{a.titulo}</p>
                                <p style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{a.descricao}</p>
                                <p style={{ fontSize: 12, color: C.dim, fontStyle: 'italic' }}>→ {a.acao}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {alertas.length === 0 && (
                    <div style={{ ...card, padding: '14px 18px', borderColor: '#166534', background: '#052e1610', marginBottom: 24 }}>
                      <p style={{ color: '#4ade80', fontWeight: 600, fontSize: 13 }}>✅ Nenhum alerta — plataforma saudável</p>
                    </div>
                  )}

                  {/* Consumo dos Crons */}
                  <div style={{ marginBottom: 24 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Consumo dos Crons (Vercel — limite 60s)</p>
                    <div style={{ ...card, padding: '18px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>Cron de Inatividade</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: p.cronRisco === 'critico' ? '#f87171' : p.cronRisco === 'aviso' ? '#fbbf24' : '#4ade80' }}>
                          ~{Math.round(p.cronInativMs / 1000)}s / 60s ({p.cronInativPerc}%)
                        </span>
                      </div>
                      <div style={{ background: '#0a0a12', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 6,
                          width: `${p.cronInativPerc}%`,
                          background: p.cronRisco === 'critico' ? '#f87171' : p.cronRisco === 'aviso' ? '#fbbf24' : '#4ade80',
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: C.dim }}>
                        <span>Base: {m.totalAlunos} alunos × 50ms/aluno</span>
                        {p.diasAteRisco != null && <span>{p.diasAteRisco > 0 ? `Risco em ~${p.diasAteRisco} dias` : 'Em risco agora'}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Métricas em cards */}
                  <div style={{ marginBottom: 24 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Métricas Atuais</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                      {[
                        { label: 'Alunos total', valor: m.totalAlunos, sub: `+${m.alunosNovosHoje} hoje`, cor: '#818cf8' },
                        { label: 'Novos (30 dias)', valor: m.alunosUltimos30, sub: m.crescimento30 != null ? `${m.crescimento30 >= 0 ? '+' : ''}${m.crescimento30}% vs anterior` : 'Sem histórico', cor: m.crescimento30 != null && m.crescimento30 > 0 ? '#4ade80' : '#f87171' },
                        { label: 'Crescimento/dia', valor: `${m.crescDiario}`, sub: 'média últimos 30d', cor: '#a78bfa' },
                        { label: 'Gestores PRO ativos', valor: m.totalGestoresAtivos, sub: `${m.gestoresSuspensos} suspensos`, cor: '#22c55e' },
                        { label: 'Vencem em 7 dias', valor: m.gestoresExpirando7dias, sub: 'painéis PRO', cor: m.gestoresExpirando7dias > 5 ? '#fbbf24' : C.dim },
                        { label: 'Clientes ativos', valor: m.totalTenantsAtivos, sub: `${m.tenantsSemInstancia} sem WhatsApp`, cor: m.tenantsSemInstancia > 0 ? '#fbbf24' : '#22c55e' },
                        { label: 'PIX parados +4d', valor: m.pagsPendentesAntigos, sub: 'gestores sem confirmação', cor: m.pagsPendentesAntigos > 0 ? '#f87171' : C.dim },
                        { label: 'Cobranças SaaS', valor: m.cobrancasPendentes, sub: 'pendentes de pagamento', cor: m.cobrancasPendentes > 2 ? '#fbbf24' : C.dim },
                      ].map((item, i) => (
                        <div key={i} style={{ ...card, padding: '14px 16px' }}>
                          <p style={{ fontSize: 26, fontWeight: 800, color: item.cor, marginBottom: 2 }}>{item.valor}</p>
                          <p style={{ fontSize: 12, color: C.text, fontWeight: 600, marginBottom: 2 }}>{item.label}</p>
                          <p style={{ fontSize: 11, color: C.dim }}>{item.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Previsão de crescimento */}
                  <div style={{ ...card, padding: '16px 20px' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Previsão de crescimento</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: 13 }}>
                      {[
                        { label: 'Em 30 dias', val: Math.round(m.totalAlunos + m.crescDiario * 30) },
                        { label: 'Em 60 dias', val: Math.round(m.totalAlunos + m.crescDiario * 60) },
                        { label: 'Em 90 dias', val: Math.round(m.totalAlunos + m.crescDiario * 90) },
                      ].map((item, i) => {
                        const percCron = Math.min(100, Math.round(item.val * 50 / 60000 * 100))
                        const risco = percCron >= 85 ? '#f87171' : percCron >= 60 ? '#fbbf24' : '#4ade80'
                        return (
                          <div key={i} style={{ background: darkMode ? '#080810' : '#f8fafc', borderRadius: 8, padding: '12px 14px' }}>
                            <p style={{ fontSize: 11, color: C.dim, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                            <p style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4 }}>{item.val.toLocaleString('pt-BR')}</p>
                            <p style={{ fontSize: 11, color: risco }}>Cron: ~{percCron}% do limite</p>
                          </div>
                        )
                      })}
                    </div>
                    <p style={{ fontSize: 11, color: C.dim, marginTop: 10 }}>
                      * Previsão linear baseada na média dos últimos 30 dias ({m.crescDiario} alunos/dia).
                      Cron entra em risco quando ultrapassa 85% do limite de 60s da Vercel.
                    </p>
                  </div>
                </>
              )
            })()}
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

        {/* ── Guia de Implantação ── */}
        {aba === 'implantacao' && (
          <div style={{ maxWidth: 800 }}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em' }}>Guia de Implantação</h1>
              <p style={{ color: C.dim, fontSize: 13 }}>Passo a passo para ativar um novo cliente na plataforma</p>
            </div>

            {[
              {
                num: '1', titulo: 'Assinar o Contrato (antes de tudo)', cor: '#818cf8',
                steps: [
                  'Acesse a aba Contratos e preencha os dados do cliente',
                  'Clique em Visualizar Contrato → Imprimir / Baixar PDF',
                  'Envie o PDF para o cliente assinar (digital ou físico)',
                  'Valor de implantação: emita pelo Boleto Avulso para receber no ato',
                  'Só prossiga para o próximo passo após confirmar o contrato',
                ],
              },
              {
                num: '2', titulo: 'Criar a Instância WhatsApp (Evolution API)', cor: '#f59e0b',
                steps: [
                  'Acesse o painel da Evolution API (URL configurada no servidor)',
                  'Clique em Create Instance → dê um nome curto e único (ex: assoc-xyz)',
                  'Clique em Connect e escaneie o QR Code com o WhatsApp DO CLIENTE',
                  'Aguarde o status Connected — agora o número do cliente está conectado',
                  'ANOTE o nome da instância — você vai precisar nos próximos passos',
                  '⚠️ O WhatsApp precisa estar ativo (não pode ser conta Business com restrições de API)',
                ],
              },
              {
                num: '3', titulo: 'Configurar Webhook da Instância (Evolution API)', cor: '#f59e0b',
                steps: [
                  'Na Evolution API, abra a instância criada e vá em Webhook',
                  'Ative o webhook e coloque a URL:',
                  '• URL: [URL_DA_PLATAFORMA]/api/webhooks/whatsapp',
                  '• Ex: https://[dominio-do-cliente]/api/webhooks/whatsapp',
                  'Ative os eventos: MESSAGES_UPSERT e CONNECTION_UPDATE',
                  'Salve — agora mensagens recebidas chegam para a plataforma',
                ],
              },
              {
                num: '4', titulo: 'Cadastrar o Cliente no Painel', cor: '#22c55e',
                steps: [
                  'Acesse Clientes → Novo Cliente → Associação',
                  'Preencha: Nome da empresa, Domínio (ex: uni.assoc.com.br), WhatsApp e E-mail do responsável',
                  'Clique em Cadastrar — o cliente fica salvo mas ainda INATIVO',
                  '⚠️ O domínio deve ser o domínio RAIZ do cliente (sem subdomínio)',
                ],
              },
              {
                num: '5', titulo: 'Executar o Onboarding', cor: '#818cf8',
                steps: [
                  'Na lista de Clientes, clique em Onboarding no card do cliente',
                  'Preencha: Nome do Admin, E-mail do Admin, Domínio e Instância WhatsApp (ex: assoc-xyz)',
                  'Clique em Executar Onboarding — o sistema faz TUDO automaticamente:',
                  '• Ativa o cliente (sem PIX — pagou a implantação no contrato)',
                  '• Cria usuário admin sem senha (acesso por link)',
                  '• Registra os subdomínios free., pro., adm. no Vercel',
                  '• Configura DNS no Cloudflare (se token configurado no servidor)',
                  '• Envia link de primeiro acesso por WhatsApp para o responsável',
                ],
              },
              {
                num: '6', titulo: 'Configurar DNS (se Cloudflare não for automático)', cor: '#06b6d4',
                steps: [
                  'Se o cliente tem o domínio em outro provedor (Registro.br, GoDaddy, etc.):',
                  'O cliente acessa o painel DNS e cria 3 registros CNAME:',
                ],
                tabela: [
                  { nome: 'adm.dominio.com.br', tipo: 'CNAME', destino: 'cname.vercel-dns.com' },
                  { nome: 'free.dominio.com.br', tipo: 'CNAME', destino: 'cname.vercel-dns.com' },
                  { nome: 'pro.dominio.com.br', tipo: 'CNAME', destino: 'cname.vercel-dns.com' },
                ],
                stepsPos: [
                  'Se o domínio está no Cloudflare com token configurado no servidor → DNS já foi criado automaticamente no passo 5',
                  'Propagação DNS: normalmente minutos, pode levar até 48h',
                  'Teste: acesse adm.dominiodocliente.com.br — deve abrir a plataforma',
                ],
              },
              {
                num: '7', titulo: 'Configurar Cobrança no Painel Oito7', cor: '#a78bfa',
                steps: [
                  'Acesse a aba Cobranças neste painel',
                  'No card do cliente, configure o Modo PRO:',
                  '• PRO paga individual → cada PRO paga direto para você (Oito7)',
                  '• PRO incluso no plano → associação paga tudo, PROs são gratuitos',
                  '• PRO por rede (gratuito) → PRO ganha acesso ao acumular 20+ indicações',
                  'Se modo individual: defina o Valor PRO (R$) — preço mensal por painel PRO',
                  'Defina a Mensalidade da associação (mensalidade que a associação paga para você)',
                  'Clique fora dos campos para salvar — aparece automaticamente',
                ],
              },
              {
                num: '8', titulo: 'Registrar Webhook do PIX (EFI Bank)', cor: '#22c55e',
                steps: [
                  'Acesse a aba Cobranças neste painel',
                  'Clique em Registrar Webhook Efí — configura notificações automáticas de PIX',
                  'Só precisa fazer isso UMA VEZ — vale para todos os clientes',
                  'A partir daí o sistema confirma PIX automaticamente e ativa/renova planos',
                ],
              },
              {
                num: '9', titulo: 'Configurar a Plataforma (o cliente faz)', cor: '#f472b6',
                steps: [
                  'O cliente recebeu o link de primeiro acesso por WhatsApp',
                  'Ele acessa adm.[domínio]/admin e define a senha pelo link',
                  'No painel Admin, ele configura: Logo, Cores, Nome da plataforma',
                  'Cria os Módulos e Aulas do treinamento',
                  'Você pode ajudar durante a implantação se o plano incluir suporte',
                ],
              },
              {
                num: '10', titulo: 'Testar Tudo Antes de Entregar', cor: '#f87171',
                steps: [
                  'Acesse a aba Testar neste painel → verifique os links do cliente',
                  'Abra free.[domínio]/captacao e faça um cadastro teste',
                  '→ Deve chegar WhatsApp de boas-vindas pelo número do CLIENTE (não pela Oito7)',
                  'Acesse pro.[domínio] e tente ativar um painel PRO',
                  '→ Deve gerar PIX com o valor configurado e ativar após pagamento',
                  'Confirme que o admin consegue acessar adm.[domínio]/admin',
                  '✅ Só entregue ao cliente depois de passar por todos esses testes',
                ],
              },
            ].map(passo => (
              <div key={passo.num} style={{ ...card, padding: '20px 24px', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <span style={{ width: 28, height: 28, background: `${passo.cor}20`, border: `1px solid ${passo.cor}40`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: passo.cor, flexShrink: 0 }}>{passo.num}</span>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>{passo.titulo}</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 40 }}>
                  {passo.steps.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                      {!s.startsWith('•') && <span style={{ color: passo.cor, flexShrink: 0, marginTop: 2 }}>›</span>}
                      <span style={{ color: s.startsWith('•') ? C.dim : C.muted }}>{s.replace(/\*\*(.*?)\*\*/g, '$1').replace(/`(.*?)`/g, '$1')}</span>
                    </div>
                  ))}
                  {(passo as any).tabela && (
                    <div style={{ background: darkMode ? '#080810' : '#f8fafc', borderRadius: 8, padding: '10px 14px', marginTop: 6, fontFamily: 'monospace', fontSize: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', gap: '4px 16px', color: C.dim, fontWeight: 700, marginBottom: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <span>Subdomínio</span><span>Tipo</span><span>Destino</span>
                      </div>
                      {(passo as any).tabela.map((r: any) => (
                        <div key={r.nome} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', gap: '4px 16px', color: C.text, padding: '4px 0', borderTop: `1px solid ${C.border}` }}>
                          <span style={{ color: '#22c55e' }}>{r.nome}</span>
                          <span style={{ color: C.dim }}>{r.tipo}</span>
                          <span style={{ color: '#818cf8' }}>{r.destino}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {(passo as any).stepsPos?.map((s: string, i: number) => (
                    <div key={`pos${i}`} style={{ display: 'flex', gap: 8, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                      <span style={{ color: passo.cor, flexShrink: 0, marginTop: 2 }}>›</span>
                      <span>{s.replace(/`(.*?)`/g, '$1')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ ...card, padding: '16px 20px', borderColor: '#166534', background: '#052e1610', marginTop: 8 }}>
              <p style={{ fontWeight: 600, fontSize: 13, color: '#4ade80', marginBottom: 8 }}>Checklist rápido</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 12, color: C.dim }}>
                {['Contrato assinado', 'Instância WhatsApp criada e conectada', 'Webhook da instância configurado', 'Cliente cadastrado no painel', 'Onboarding executado (cliente ativado)', 'DNS CNAME configurado (3 registros)', 'Modo de cobrança PRO definido', 'Mensalidade e valor PRO configurados', 'Webhook EFI Bank registrado', 'Teste de cadastro FREE realizado', 'Teste de ativação PRO realizado', 'Admin do cliente acessou o painel'].map(item => (
                  <div key={item} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ color: '#4ade80' }}>{Icons.check}</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Agente IA ── */}
        {aba === 'agente' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em' }}>Agente IA</h1>
              <p style={{ color: C.dim, fontSize: 13 }}>Configuracao global do assistente e visao de uso por tenant</p>
            </div>

            {agenteLoading && <p style={{ color: C.dim, fontSize: 13 }}>Carregando...</p>}

            {!agenteLoading && (
              <>
                {/* Config Global */}
                <div style={{ ...card, padding: 24 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 18, color: C.text }}>Configuracao Global (Oito7)</p>
                  <p style={{ color: C.dim, fontSize: 12, marginBottom: 20, lineHeight: 1.6 }}>
                    Valores padrao herdados por todos os tenants que nao tiverem config propria.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={lbl}>Nome do Assistente</label>
                      <input style={inp} value={agenteForm.nome_assistente}
                        onChange={e => setAgenteForm(f => ({ ...f, nome_assistente: e.target.value }))} />
                    </div>
                    <div>
                      <label style={lbl}>Modelo Padrao</label>
                      <select style={{ ...inp, cursor: 'pointer' }} value={agenteForm.modelo_padrao}
                        onChange={e => setAgenteForm(f => ({ ...f, modelo_padrao: e.target.value }))}>
                        <option value="haiku">Haiku (rapido, economico)</option>
                        <option value="sonnet">Sonnet (avancado)</option>
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Creditos Boas-Vindas Padrao</label>
                      <input style={inp} type="number" min={0} value={agenteForm.creditos_boas_vindas_padrao}
                        onChange={e => setAgenteForm(f => ({ ...f, creditos_boas_vindas_padrao: Number(e.target.value) }))} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
                      <input type="checkbox" id="agente_ativo" checked={agenteForm.ativo}
                        onChange={e => setAgenteForm(f => ({ ...f, ativo: e.target.checked }))} />
                      <label htmlFor="agente_ativo" style={{ color: C.text, fontSize: 13 }}>Agente ativo globalmente</label>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={lbl}>Prompt Base (instrucoes do assistente)</label>
                    <textarea style={{ ...inp, minHeight: 120, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                      value={agenteForm.prompt_base ?? ''}
                      placeholder="Voce e um assistente especialista em protecao veicular..."
                      onChange={e => setAgenteForm(f => ({ ...f, prompt_base: e.target.value || null }))} />
                    <p style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>
                      Este prompt e a base do assistente. Os tenants podem adicionar instrucoes extras pelo painel admin deles.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={salvarAgenteConfig} disabled={agenteSalvando} style={{ ...btn, opacity: agenteSalvando ? 0.6 : 1 }}>
                      {agenteSalvando ? 'Salvando...' : 'Salvar Configuracao'}
                    </button>
                    {agenteMsg && <p style={{ fontSize: 13, color: agenteMsg.includes('Erro') ? '#f87171' : '#4ade80' }}>{agenteMsg}</p>}
                  </div>
                </div>

                {/* Tabela de Consumo por Tenant */}
                <div style={{ ...card, padding: 24 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 18, color: C.text }}>Uso do Agente por Tenant</p>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr>
                          {['Tenant', 'Agente', 'Instancia WA', 'Modelo', 'Credits vendidos', 'Consumidos', 'Receita', 'PROs ativos'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700, color: C.dim, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(agenteData?.tenants ?? []).map(t => (
                          <tr key={t.id} style={{ borderBottom: `1px solid ${C.border}`, cursor: 'pointer', transition: 'background 0.15s' }}
                            onClick={() => setAgenteTenantSel(agenteTenantSel === t.id ? null : t.id)}
                            onMouseEnter={e => (e.currentTarget.style.background = darkMode ? '#ffffff08' : '#f8fafc')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            <td style={{ padding: '10px 12px', fontWeight: 600, color: C.text }}>
                              <div>{t.nome}</div>
                              {t.dominio && <div style={{ fontSize: 11, color: C.dim, fontWeight: 400 }}>{t.dominio}</div>}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              {t.config ? (
                                <span style={{ background: t.config.ativo ? '#052e16' : `${C.border}80`, color: t.config.ativo ? '#4ade80' : C.dim, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
                                  {t.config.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                              ) : (
                                <span style={{ background: `${C.border}80`, color: C.dim, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>Sem config</span>
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', color: t.config?.instancia_whatsapp ? C.text : C.dim, fontSize: 12 }}>
                              {t.config?.instancia_whatsapp ?? '—'}
                            </td>
                            <td style={{ padding: '10px 12px', color: C.muted, fontSize: 12 }}>
                              {t.config?.modelo ?? agenteData?.configGlobal?.modelo_padrao ?? 'haiku'}
                            </td>
                            <td style={{ padding: '10px 12px', color: C.text, fontWeight: 600 }}>{t.stats.creditos_total.toLocaleString('pt-BR')}</td>
                            <td style={{ padding: '10px 12px', color: t.stats.creditos_consumidos > 0 ? '#f59e0b' : C.dim }}>
                              {t.stats.creditos_consumidos.toLocaleString('pt-BR')}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#4ade80', fontWeight: 600 }}>
                              {t.stats.receita_total > 0 ? `R$ ${t.stats.receita_total.toFixed(2).replace('.', ',')}` : '—'}
                            </td>
                            <td style={{ padding: '10px 12px', color: C.muted }}>{t.stats.gestores_com_saldo}</td>
                          </tr>
                        ))}
                        {(agenteData?.tenants ?? []).length === 0 && (
                          <tr><td colSpan={8} style={{ padding: '20px 12px', color: C.dim, textAlign: 'center' }}>Nenhum tenant com dados de agente ainda.</td></tr>
                        )}
                      </tbody>
                      {(agenteData?.tenants ?? []).length > 0 && (
                        <tfoot>
                          <tr style={{ borderTop: `2px solid ${C.border}` }}>
                            <td colSpan={4} style={{ padding: '10px 12px', fontWeight: 700, color: C.text, fontSize: 12 }}>Total</td>
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: C.text }}>
                              {(agenteData?.tenants ?? []).reduce((s, t) => s + t.stats.creditos_total, 0).toLocaleString('pt-BR')}
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: '#f59e0b' }}>
                              {(agenteData?.tenants ?? []).reduce((s, t) => s + t.stats.creditos_consumidos, 0).toLocaleString('pt-BR')}
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: '#4ade80' }}>
                              {(() => {
                                const total = (agenteData?.tenants ?? []).reduce((s, t) => s + t.stats.receita_total, 0)
                                return total > 0 ? `R$ ${total.toFixed(2).replace('.', ',')}` : '—'
                              })()}
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: C.text }}>
                              {(agenteData?.tenants ?? []).reduce((s, t) => s + t.stats.gestores_com_saldo, 0)}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

                {/* Tabela de Custos de Credito */}
                <div style={{ ...card, padding: 24 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: C.text }}>Tabela de Custos por Acao</p>
                  <p style={{ color: C.dim, fontSize: 12, marginBottom: 16 }}>Quantos creditos cada acao consome. Valores fixos no sistema.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {[
                      { acao: 'Mensagem / pergunta', custo: 1, cor: '#4ade80' },
                      { acao: 'Resumo do consultor', custo: 1, cor: '#4ade80' },
                      { acao: 'Equipe (dados da equipe)', custo: 1, cor: '#4ade80' },
                      { acao: 'Lembrete / tarefa', custo: 1, cor: '#4ade80' },
                      { acao: 'Script de abordagem', custo: 3, cor: '#f59e0b' },
                      { acao: 'Comparar com concorrente', custo: 5, cor: '#f87171' },
                    ].map(r => (
                      <div key={r.acao} style={{ background: darkMode ? '#080810' : '#f8fafc', borderRadius: 8, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: C.text }}>{r.acao}</span>
                        <span style={{ fontWeight: 700, fontSize: 14, color: r.cor }}>{r.custo} cr.</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Contratos ── */}
        {aba === 'contratos' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em' }}>Contratos</h1>
              <p style={{ color: C.dim, fontSize: 13 }}>Gere contratos de prestação de serviços com o cabeçalho da Oito7 Digital</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

              {/* Formulário */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ ...card, padding: '20px 24px' }}>
                  <p style={{ fontWeight: 600, fontSize: 11, color: C.muted, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Empresa Contratante (Oito7 Digital)</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div><label style={lbl}>Razão Social *</label><input style={inp} value={contratoForm.empresa_nome} onChange={e => setContratoForm(p => ({ ...p, empresa_nome: e.target.value }))} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div><label style={lbl}>CNPJ</label><input style={inp} value={contratoForm.empresa_cnpj} onChange={e => setContratoForm(p => ({ ...p, empresa_cnpj: e.target.value }))} placeholder="00.000.000/0001-00" /></div>
                      <div><label style={lbl}>Responsável</label><input style={inp} value={contratoForm.empresa_responsavel} onChange={e => setContratoForm(p => ({ ...p, empresa_responsavel: e.target.value }))} /></div>
                    </div>
                    <div><label style={lbl}>Endereço</label><input style={inp} value={contratoForm.empresa_endereco} onChange={e => setContratoForm(p => ({ ...p, empresa_endereco: e.target.value }))} placeholder="Rua, nº, Bairro, Cidade – UF" /></div>
                  </div>
                </div>

                <div style={{ ...card, padding: '20px 24px' }}>
                  <p style={{ fontWeight: 600, fontSize: 11, color: C.muted, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Empresa Contratada (Cliente)</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div><label style={lbl}>Selecionar cliente existente</label>
                      <select style={{ ...inp, cursor: 'pointer' }}
                        onChange={e => {
                          const c = clientes.find(x => x.id === e.target.value)
                          if (c) setContratoForm(p => ({ ...p, cliente_nome: c.nome, cliente_responsavel: c.contato_nome || '' }))
                        }}>
                        <option value="">— selecione ou preencha abaixo —</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>
                    <div><label style={lbl}>Razão Social / Nome *</label><input style={inp} value={contratoForm.cliente_nome} onChange={e => setContratoForm(p => ({ ...p, cliente_nome: e.target.value }))} placeholder="Nome da associação ou empresa" /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div><label style={lbl}>CNPJ / CPF</label><input style={inp} value={contratoForm.cliente_cnpj} onChange={e => setContratoForm(p => ({ ...p, cliente_cnpj: e.target.value }))} /></div>
                      <div><label style={lbl}>Responsável</label><input style={inp} value={contratoForm.cliente_responsavel} onChange={e => setContratoForm(p => ({ ...p, cliente_responsavel: e.target.value }))} /></div>
                    </div>
                    <div><label style={lbl}>Endereço</label><input style={inp} value={contratoForm.cliente_endereco} onChange={e => setContratoForm(p => ({ ...p, cliente_endereco: e.target.value }))} placeholder="Rua, nº, Bairro, Cidade – UF" /></div>
                  </div>
                </div>

                <div style={{ ...card, padding: '20px 24px' }}>
                  <p style={{ fontWeight: 600, fontSize: 11, color: C.muted, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Objeto e Valores</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div><label style={lbl}>Serviços contratados</label><textarea style={{ ...inp, minHeight: 80, resize: 'vertical' } as React.CSSProperties} value={contratoForm.servicos} onChange={e => setContratoForm(p => ({ ...p, servicos: e.target.value }))} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div><label style={lbl}>Valor de implantação (R$)</label><input style={inp} type="number" min="0" value={contratoForm.valor_implantacao} onChange={e => setContratoForm(p => ({ ...p, valor_implantacao: e.target.value }))} placeholder="0,00" /></div>
                      <div><label style={lbl}>Mensalidade (R$)</label><input style={inp} type="number" min="0" value={contratoForm.valor_mensalidade} onChange={e => setContratoForm(p => ({ ...p, valor_mensalidade: e.target.value }))} placeholder="0,00" /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      <div><label style={lbl}>Prazo (meses)</label><input style={inp} type="number" min="1" value={contratoForm.prazo_meses} onChange={e => setContratoForm(p => ({ ...p, prazo_meses: e.target.value }))} /></div>
                      <div><label style={lbl}>Data do contrato</label><input style={inp} value={contratoForm.data} onChange={e => setContratoForm(p => ({ ...p, data: e.target.value }))} /></div>
                      <div><label style={lbl}>Cidade/UF</label><input style={inp} value={contratoForm.cidade} onChange={e => setContratoForm(p => ({ ...p, cidade: e.target.value }))} /></div>
                    </div>
                  </div>
                </div>

                <button onClick={() => setContratoVer(true)} disabled={!contratoForm.empresa_nome || !contratoForm.cliente_nome}
                  style={{ ...btn, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', opacity: !contratoForm.empresa_nome || !contratoForm.cliente_nome ? 0.5 : 1 }}>
                  {Icons.invoice} Visualizar Contrato
                </button>
              </div>

              {/* Preview resumido */}
              <div style={{ ...card, padding: '24px' }}>
                <p style={{ fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 12 }}>Pré-visualização</p>
                <div style={{ background: darkMode ? '#080810' : '#f8fafc', borderRadius: 8, padding: '20px', fontFamily: 'Georgia, serif', fontSize: 13, color: C.muted, lineHeight: 1.8 }}>
                  <p style={{ textAlign: 'center', fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 4 }}>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</p>
                  <p style={{ textAlign: 'center', fontSize: 12, color: C.dim, marginBottom: 16 }}>{contratoForm.cidade}, {contratoForm.data}</p>
                  <p><strong style={{ color: C.text }}>CONTRATANTE:</strong> {contratoForm.empresa_nome || '—'}</p>
                  {contratoForm.empresa_cnpj && <p style={{ fontSize: 12, color: C.dim }}>CNPJ: {contratoForm.empresa_cnpj}</p>}
                  <p style={{ marginTop: 8 }}><strong style={{ color: C.text }}>CONTRATADA:</strong> {contratoForm.cliente_nome || '—'}</p>
                  {contratoForm.cliente_cnpj && <p style={{ fontSize: 12, color: C.dim }}>CNPJ/CPF: {contratoForm.cliente_cnpj}</p>}
                  <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 12, paddingTop: 12 }}>
                    <p><strong style={{ color: C.text }}>Objeto:</strong> {contratoForm.servicos.substring(0, 100)}...</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, background: `${C.border}40`, borderRadius: 6, padding: '10px' }}>
                    <div>
                      <p style={{ fontSize: 11, color: C.dim, marginBottom: 2 }}>Implantação</p>
                      <p style={{ fontWeight: 700, color: C.text }}>R$ {Number(contratoForm.valor_implantacao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: C.dim, marginBottom: 2 }}>Mensalidade</p>
                      <p style={{ fontWeight: 700, color: C.text }}>R$ {Number(contratoForm.valor_mensalidade || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</p>
                    </div>
                  </div>
                  <p style={{ marginTop: 12, fontSize: 12, color: C.dim }}>Prazo: {contratoForm.prazo_meses} meses</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Modal Contrato ── */}
      {contratoVer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '24px 16px', overflowY: 'auto' }}>
          <div style={{ background: '#fff', color: '#111', borderRadius: 8, width: '100%', maxWidth: 740, padding: '48px 56px', fontFamily: 'Georgia, Times, serif', lineHeight: 1.8, fontSize: 13 }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 32, borderBottom: '2px solid #111', paddingBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#555', marginBottom: 6 }}>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</p>
              <p style={{ fontSize: 18, fontWeight: 700 }}>{contratoForm.empresa_nome}</p>
              {contratoForm.empresa_cnpj && <p style={{ fontSize: 12, color: '#555' }}>CNPJ: {contratoForm.empresa_cnpj}</p>}
              {contratoForm.empresa_endereco && <p style={{ fontSize: 12, color: '#555' }}>{contratoForm.empresa_endereco}</p>}
            </div>

            {/* Partes */}
            <p style={{ marginBottom: 16 }}>
              <strong>CONTRATANTE:</strong> {contratoForm.empresa_nome}{contratoForm.empresa_cnpj ? `, inscrita no CNPJ sob nº ${contratoForm.empresa_cnpj}` : ''}{contratoForm.empresa_endereco ? `, com sede em ${contratoForm.empresa_endereco}` : ''}{contratoForm.empresa_responsavel ? `, neste ato representada por ${contratoForm.empresa_responsavel}` : ''}, doravante denominada <strong>CONTRATANTE</strong>.
            </p>
            <p style={{ marginBottom: 24 }}>
              <strong>CONTRATADA:</strong> {contratoForm.cliente_nome}{contratoForm.cliente_cnpj ? `, inscrita no CNPJ/CPF sob nº ${contratoForm.cliente_cnpj}` : ''}{contratoForm.cliente_endereco ? `, com sede em ${contratoForm.cliente_endereco}` : ''}{contratoForm.cliente_responsavel ? `, neste ato representada por ${contratoForm.cliente_responsavel}` : ''}, doravante denominada <strong>CONTRATADA</strong>.
            </p>

            {/* Cláusulas */}
            {[
              {
                titulo: 'CLÁUSULA 1ª – DO OBJETO',
                texto: `A CONTRATANTE obriga-se a disponibilizar à CONTRATADA acesso à plataforma EAD white-label, compreendendo os seguintes serviços: ${contratoForm.servicos}`,
              },
              {
                titulo: 'CLÁUSULA 2ª – DA REMUNERAÇÃO',
                texto: (() => {
                  const temImpl = contratoForm.valor_implantacao && Number(contratoForm.valor_implantacao) > 0
                  const temMens = contratoForm.valor_mensalidade && Number(contratoForm.valor_mensalidade) > 0
                  const valImpl = Number(contratoForm.valor_implantacao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                  const valMens = Number(contratoForm.valor_mensalidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                  const linhas: string[] = []
                  if (temImpl) linhas.push(`2.1 A CONTRATADA pagará à CONTRATANTE a título de implantação o valor único de R$ ${valImpl} (${valorPorExtenso(Number(contratoForm.valor_implantacao))}), a ser quitado no ato da assinatura deste contrato.`)
                  if (temMens) linhas.push(`${temImpl ? '2.2' : '2.1'} A partir do início da operação, a CONTRATADA pagará mensalidade no valor de R$ ${valMens} (${valorPorExtenso(Number(contratoForm.valor_mensalidade))} mensais), com vencimento todo dia 10 do mês subsequente.`)
                  return linhas.join('\n\n') || 'Valores a serem definidos conforme proposta comercial.'
                })(),
              },
              {
                titulo: 'CLÁUSULA 3ª – DO PRAZO',
                texto: `O presente contrato tem vigência de ${contratoForm.prazo_meses} (${porExtensoMeses(Number(contratoForm.prazo_meses))}) meses, a contar da data de assinatura, podendo ser renovado automaticamente por igual período, salvo manifestação contrária de qualquer das partes com 30 dias de antecedência.`,
              },
              {
                titulo: 'CLÁUSULA 4ª – DAS OBRIGAÇÕES DA CONTRATANTE',
                texto: '4.1 Disponibilizar a plataforma em funcionamento contínuo, com disponibilidade mínima de 99% mensal.\n4.2 Prestar suporte técnico para o painel administrativo.\n4.3 Realizar atualizações e melhorias na plataforma sem custo adicional.',
              },
              {
                titulo: 'CLÁUSULA 5ª – DAS OBRIGAÇÕES DA CONTRATADA',
                texto: '5.1 Efetuar os pagamentos nos prazos estabelecidos.\n5.2 Configurar os registros DNS do domínio próprio, conforme orientação técnica fornecida.\n5.3 Responsabilizar-se pelo conteúdo publicado na plataforma (módulos, aulas, materiais).\n5.4 Não utilizar a plataforma para fins ilegais ou em desacordo com a legislação brasileira.',
              },
              {
                titulo: 'CLÁUSULA 6ª – DA RESCISÃO',
                texto: 'O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 dias. Em caso de inadimplência superior a 30 dias, a CONTRATANTE poderá suspender o acesso imediatamente, sem prejuízo da cobrança dos valores devidos.',
              },
              {
                titulo: 'CLÁUSULA 7ª – DO FORO',
                texto: `Fica eleito o foro da Comarca de ${contratoForm.cidade.split('–')[0].trim()}, para dirimir quaisquer litígios oriundos deste instrumento, com renúncia a qualquer outro, por mais privilegiado que seja.`,
              },
            ].map(c => (
              <div key={c.titulo} style={{ marginBottom: 20 }}>
                <p style={{ fontWeight: 700, marginBottom: 6 }}>{c.titulo}</p>
                <p style={{ whiteSpace: 'pre-line' }}>{c.texto}</p>
              </div>
            ))}

            {/* Local e Data */}
            <p style={{ marginTop: 32, textAlign: 'center' }}>{contratoForm.cidade}, {contratoForm.data}.</p>

            {/* Assinaturas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 48 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid #333', paddingTop: 8 }}>
                  <p style={{ fontWeight: 700 }}>{contratoForm.empresa_nome}</p>
                  {contratoForm.empresa_responsavel && <p style={{ fontSize: 12, color: '#555' }}>{contratoForm.empresa_responsavel}</p>}
                  <p style={{ fontSize: 12, color: '#555' }}>CONTRATANTE</p>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid #333', paddingTop: 8 }}>
                  <p style={{ fontWeight: 700 }}>{contratoForm.cliente_nome || 'CONTRATADA'}</p>
                  {contratoForm.cliente_responsavel && <p style={{ fontSize: 12, color: '#555' }}>{contratoForm.cliente_responsavel}</p>}
                  <p style={{ fontSize: 12, color: '#555' }}>CONTRATADA</p>
                </div>
              </div>
            </div>

            {/* Botões (não imprimem) */}
            <div className="no-print" style={{ display: 'flex', gap: 10, marginTop: 32, justifyContent: 'flex-end' }}>
              <button onClick={() => setContratoVer(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '10px 18px', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#333' }}>
                Fechar
              </button>
              <button onClick={() => window.print()}
                style={{ background: '#4f46e5', border: 'none', borderRadius: 8, padding: '10px 18px', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#fff' }}>
                Imprimir / Baixar PDF
              </button>
            </div>
          </div>
          <style>{`@media print { .no-print { display: none !important; } body { background: white; } }`}</style>
        </div>
      )}

      {/* ── Modal Onboarding ── */}
      {onboardingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={e => e.target === e.currentTarget && setOnboardingId(null)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '28px 32px', width: 500, maxWidth: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Onboarding Automático</h2>
              <button onClick={() => setOnboardingId(null)} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', display: 'flex' }}>{Icons.close}</button>
            </div>
            <p style={{ color: C.dim, fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>Ativa o cliente, cria o admin, registra subdomínios no Vercel e envia link de senha por WhatsApp.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Nome do Admin *', key: 'admin_nome', type: 'text', placeholder: 'Nome do responsável' },
                { label: 'E-mail do Admin *', key: 'admin_email', type: 'email', placeholder: 'admin@empresa.com.br' },
                { label: 'Domínio (opcional)', key: 'dominio', type: 'text', placeholder: 'uni.empresa.com.br' },
                { label: 'Instância WhatsApp (Evolution API)', key: 'whatsapp_instancia', type: 'text', placeholder: 'ex: assoc-xyz' },
              ].map(f => (
                <div key={f.key}>
                  <label style={lbl}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={(onboardingForm as any)[f.key]}
                    onChange={e => setOnboardingForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={inp} />
                </div>
              ))}
              <div style={{ background: darkMode ? '#080810' : '#f8fafc', borderRadius: 8, padding: '10px 12px', fontSize: 11, color: C.dim, lineHeight: 1.7 }}>
                <p style={{ color: C.muted, fontWeight: 600, marginBottom: 4 }}>Instância WhatsApp</p>
                <p>Crie a instância em <span style={{ color: '#818cf8' }}>evolution.oito7digital.com.br</span>, conecte pelo QR Code e informe o nome aqui. As notificações do cliente sairão pelo número dele.</p>
              </div>
            </div>
            {onboardingMsg.length > 0 && (
              <div style={{ marginTop: 16, background: darkMode ? '#080810' : '#f8fafc', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {onboardingMsg.map((m, i) => (
                  <p key={i} style={{ fontSize: 12, color: m.startsWith('✅') ? '#4ade80' : m.startsWith('⚠️') ? '#fbbf24' : C.dim, margin: 0 }}>{m}</p>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setOnboardingId(null)} style={btnGhost}>Cancelar</button>
              <button onClick={() => rodarOnboarding(onboardingId)} disabled={onboardingLoading || !onboardingForm.admin_email || !onboardingForm.admin_nome}
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
