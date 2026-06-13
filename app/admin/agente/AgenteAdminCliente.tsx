'use client'
import { useState, useEffect } from 'react'
import { TogglePill } from '@/app/components/TogglePill'

type AgenteConfig = {
 nome_assistente: string
 instancia_whatsapp: string | null
 prompt_extra: string | null
 modelo: string
 creditos_boas_vindas: number
 ativo: boolean
}

type Argumento = { id: string; categoria: string; argumento: string; ordem: number; ativo: boolean }
type Pacote = { id: string; nome: string; creditos: number; valor: number; ordem: number; ativo: boolean }

const inp: React.CSSProperties = {
 width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)',
 borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14,
 outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
}

const lbl: React.CSSProperties = {
 display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)',
 marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8,
}

function Passo({ num, cor, titulo, children }: { num: string; cor: string; titulo: string; children: React.ReactNode }) {
 return (
 <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '16px 18px' }}>
 <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${cor}18`, border: `2px solid ${cor}50`, color: cor, fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{num}</div>
 <div style={{ flex: 1, minWidth: 0 }}>
 <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{titulo}</p>
 {children}
 </div>
 </div>
 )
}

function WebhookUrl() {
 const [url, setUrl] = useState('')
 const [copiado, setCopiado] = useState(false)
 useEffect(() => { setUrl(`${window.location.origin}/api/webhooks/whatsapp`) }, [])
 function copiar() {
 navigator.clipboard.writeText(url)
 setCopiado(true)
 setTimeout(() => setCopiado(false), 2500)
 }
 return (
 <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
 <code style={{ flex: 1, background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: 'var(--avp-text)', fontFamily: 'monospace', wordBreak: 'break-all' as const }}>
 {url}
 </code>
 <button onClick={copiar} style={{ background: copiado ? 'rgba(34,197,94,0.15)' : 'rgba(79,70,229,0.15)', border: `1px solid ${copiado ? 'rgba(34,197,94,0.3)' : 'rgba(79,70,229,0.3)'}`, color: copiado ? 'var(--avp-green)' : '#818cf8', borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
 {copiado ? 'Copiado!' : 'Copiar URL'}
 </button>
 </div>
 )
}

function SectionCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
 return (
 <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
 <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--avp-border)' }}>
 <h2 style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>{title}</h2>
 {desc && <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', margin: '4px 0 0' }}>{desc}</p>}
 </div>
 <div style={{ padding: 24 }}>{children}</div>
 </div>
 )
}

export default function AgenteAdminCliente({
 configInicial, argumentosIniciais, pacotesIniciais,
}: {
 configInicial: AgenteConfig | null
 argumentosIniciais: Argumento[]
 pacotesIniciais: Pacote[]
}) {
 // ── Config ─────────────────────────────────────────────────────────────────
 const [cfg, setCfg] = useState<AgenteConfig>({
 nome_assistente: configInicial?.nome_assistente ?? 'Assistente',
 instancia_whatsapp: configInicial?.instancia_whatsapp ?? '',
 prompt_extra: configInicial?.prompt_extra ?? '',
 modelo: configInicial?.modelo ?? 'haiku',
 creditos_boas_vindas: configInicial?.creditos_boas_vindas ?? 50,
 ativo: configInicial?.ativo ?? true,
 })
 const [salvandoCfg, setSalvandoCfg] = useState(false)
 const [msgCfg, setMsgCfg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)

 async function salvarConfig(e: React.FormEvent) {
 e.preventDefault()
 setSalvandoCfg(true)
 const res = await fetch('/api/admin/agente', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(cfg),
 })
 const data = await res.json()
 setMsgCfg(res.ok ? { tipo: 'ok', texto: 'Configuração salva!' } : { tipo: 'err', texto: data.error ?? 'Erro ao salvar.' })
 setSalvandoCfg(false)
 setTimeout(() => setMsgCfg(null), 4000)
 }

 // ── Argumentos ─────────────────────────────────────────────────────────────
 const [argumentos, setArgumentos] = useState<Argumento[]>(argumentosIniciais)
 const [novoArg, setNovoArg] = useState({ categoria: '', argumento: '' })
 const [salvandoArg, setSalvandoArg] = useState(false)
 const [msgArg, setMsgArg] = useState<string | null>(null)

 async function adicionarArgumento(e: React.FormEvent) {
 e.preventDefault()
 if (!novoArg.categoria || !novoArg.argumento) return
 setSalvandoArg(true)
 const res = await fetch('/api/admin/agente/argumentos', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ ...novoArg, ordem: argumentos.length }),
 })
 const data = await res.json()
 if (res.ok && data.argumento) {
 setArgumentos(prev => [...prev, data.argumento])
 setNovoArg({ categoria: '', argumento: '' })
 setMsgArg('Argumento adicionado!')
 } else {
 setMsgArg(data.error ?? 'Erro ao adicionar.')
 }
 setSalvandoArg(false)
 setTimeout(() => setMsgArg(null), 3000)
 }

 async function toggleArgumento(id: string, ativo: boolean) {
 await fetch('/api/admin/agente/argumentos', {
 method: 'PUT', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ id, ativo }),
 })
 setArgumentos(prev => prev.map(a => a.id === id ? { ...a, ativo } : a))
 }

 async function excluirArgumento(id: string) {
 if (!confirm('Excluir este argumento?')) return
 await fetch('/api/admin/agente/argumentos', {
 method: 'DELETE', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ id }),
 })
 setArgumentos(prev => prev.filter(a => a.id !== id))
 }

 // ── Pacotes ────────────────────────────────────────────────────────────────
 const [pacotes, setPacotes] = useState<Pacote[]>(pacotesIniciais)
 const [novoPacote, setNovoPacote] = useState({ nome: '', creditos: '', valor: '' })
 const [salvandoPacote, setSalvandoPacote] = useState(false)
 const [msgPacote, setMsgPacote] = useState<string | null>(null)

 async function adicionarPacote(e: React.FormEvent) {
 e.preventDefault()
 if (!novoPacote.nome || !novoPacote.creditos || !novoPacote.valor) return
 setSalvandoPacote(true)
 const res = await fetch('/api/admin/agente/pacotes', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ ...novoPacote, ordem: pacotes.length }),
 })
 const data = await res.json()
 if (res.ok && data.pacote) {
 setPacotes(prev => [...prev, data.pacote])
 setNovoPacote({ nome: '', creditos: '', valor: '' })
 setMsgPacote('Pacote adicionado!')
 } else {
 setMsgPacote(data.error ?? 'Erro ao adicionar.')
 }
 setSalvandoPacote(false)
 setTimeout(() => setMsgPacote(null), 3000)
 }

 async function togglePacote(id: string, ativo: boolean) {
 await fetch('/api/admin/agente/pacotes', {
 method: 'PUT', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ id, ativo }),
 })
 setPacotes(prev => prev.map(p => p.id === id ? { ...p, ativo } : p))
 }

 async function excluirPacote(id: string) {
 if (!confirm('Excluir este pacote?')) return
 await fetch('/api/admin/agente/pacotes', {
 method: 'DELETE', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ id }),
 })
 setPacotes(prev => prev.filter(p => p.id !== id))
 }

 const custosRef: Record<string, number> = { mensagem: 1, resumo: 1, equipe: 1, lembrete: 1, script: 3, comparar: 5 }

 // ── Preview do prompt ──────────────────────────────────────────────────────
 const [promptPreview, setPromptPreview] = useState<string | null>(null)
 const [promptBlocos, setPromptBlocos] = useState<{ argumentos: number; modulos: number; aulas: number; temPromptExtra: boolean } | null>(null)
 const [carregandoPrompt, setCarregandoPrompt] = useState(false)
 const [mostrarPrompt, setMostrarPrompt] = useState(false)

 async function verPrompt() {
 if (mostrarPrompt) { setMostrarPrompt(false); return }
 setCarregandoPrompt(true)
 const res = await fetch('/api/admin/agente/preview-prompt')
 const data = await res.json()
 if (res.ok) {
 setPromptPreview(data.prompt)
 setPromptBlocos(data.blocos)
 setMostrarPrompt(true)
 }
 setCarregandoPrompt(false)
 }

 return (
 <div style={{ maxWidth: 780, margin: '0 auto' }}>
 <div style={{ marginBottom: 28 }}>
 <h1 style={{ fontSize: 22, fontWeight: 800 }}>Agente IA</h1>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>
 Configure o assistente de IA para os consultores PRO
 </p>
 </div>

 {/* ── Configuração principal ── */}
 <SectionCard title="Configuração do Assistente" desc="Personalização e controle do agente">
 {msgCfg && (
 <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: msgCfg.tipo === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(230,57,70,0.1)', color: msgCfg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 13, fontWeight: 600 }}>
 {msgCfg.texto}
 </div>
 )}
 <form onSubmit={salvarConfig} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
 <div>
 <label style={lbl}>Nome do Assistente</label>
 <input style={inp} value={cfg.nome_assistente} onChange={e => setCfg(p => ({ ...p, nome_assistente: e.target.value }))} placeholder="Assistente" />
 </div>
 <div>
 <label style={lbl}>Modelo de IA</label>
 <select style={{ ...inp }} value={cfg.modelo} onChange={e => setCfg(p => ({ ...p, modelo: e.target.value }))}>
 <option value="haiku">Claude Haiku — Rápido e econômico</option>
 <option value="sonnet">Claude Sonnet — Mais inteligente</option>
 </select>
 </div>
 </div>

 <div>
 <label style={lbl}>Número WhatsApp do Agente (com DDI)</label>
 <input style={inp} value={cfg.instancia_whatsapp ?? ''} onChange={e => setCfg(p => ({ ...p, instancia_whatsapp: e.target.value }))} placeholder="5587999990000" />
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>
 Número conectado na Evolution API que os PROs vão usar para falar com o agente
 </p>
 </div>

 <div>
 <label style={lbl}>Contexto adicional (opcional)</label>
 <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' as const }} value={cfg.prompt_extra ?? ''}
 onChange={e => setCfg(p => ({ ...p, prompt_extra: e.target.value }))}
 placeholder="Ex: Somos especializados em proteção veicular para caminhões. Nosso foco é o interior de SP." />
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>
 Informações extras que o agente vai considerar ao responder os PROs
 </p>
 </div>

 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
 <div>
 <label style={lbl}>Créditos de boas-vindas</label>
 <input type="number" style={inp} min={0} value={cfg.creditos_boas_vindas}
 onChange={e => setCfg(p => ({ ...p, creditos_boas_vindas: Number(e.target.value) }))} />
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>
 Concedidos automaticamente na primeira ativação do PRO
 </p>
 </div>
 <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingTop: 24 }}>
 <input type="checkbox" id="agenteAtivo" checked={cfg.ativo} onChange={e => setCfg(p => ({ ...p, ativo: e.target.checked }))} style={{ display: 'none' }} />
 <label htmlFor="agenteAtivo" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
 <TogglePill checked={cfg.ativo} />
 <div>
 <span style={{ fontSize: 14, fontWeight: 600 }}>Agente ativo</span>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', fontWeight: 400, margin: '2px 0 0' }}>
 Desative para pausar o agente sem perder as configurações
 </p>
 </div>
 </label>
 </div>
 </div>

 <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
 <button type="submit" disabled={salvandoCfg} className="btn btn-green btn-sm">
 {salvandoCfg ? 'Salvando...' : ' Salvar configuração'}
 </button>
 </div>
 </form>
 </SectionCard>

 {/* ── Preview do prompt completo ── */}
 <SectionCard title="Visualizar Prompt Completo" desc="Veja exatamente o que o agente recebe a cada conversa, com todos os blocos montados">
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
 {promptBlocos && (
 <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
 {[
 { label: 'Argumentos', val: promptBlocos.argumentos, cor: '#818cf8' },
 { label: 'Módulos', val: promptBlocos.modulos, cor: '#60a5fa' },
 { label: 'Aulas', val: promptBlocos.aulas, cor: '#4ade80' },
 { label: 'Contexto extra', val: promptBlocos.temPromptExtra ? 'Sim' : 'Não', cor: promptBlocos.temPromptExtra ? '#4ade80' : 'var(--avp-text-dim)' },
 ].map(({ label, val, cor }) => (
 <span key={label} style={{ fontSize: 12, background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 6, padding: '4px 10px' }}>
 <span style={{ color: cor, fontWeight: 700 }}>{val}</span>
 <span style={{ color: 'var(--avp-text-dim)', marginLeft: 4 }}>{label}</span>
 </span>
 ))}
 </div>
 )}
 <button onClick={verPrompt} disabled={carregandoPrompt} className="btn btn-sm"
 style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
 {carregandoPrompt ? 'Carregando...' : mostrarPrompt ? 'Ocultar prompt' : 'Visualizar prompt completo'}
 </button>
 </div>
 {mostrarPrompt && promptPreview && (
 <div style={{ marginTop: 16 }}>
 <pre style={{
 background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10,
 padding: '16px 18px', fontSize: 12, color: 'var(--avp-text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
 maxHeight: 480, overflowY: 'auto', fontFamily: 'monospace', lineHeight: 1.6, margin: 0,
 }}>
 {promptPreview}
 </pre>
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 8 }}>
 Este é o prompt montado com os dados salvos no banco. Salve as configurações antes de visualizar para ver o resultado atualizado.
 </p>
 </div>
 )}
 </SectionCard>

 {/* ── Setup Evolution API ── */}
 <SectionCard title="Configuracao do WhatsApp (Evolution API)" desc="Siga estes passos uma unica vez para ligar o agente ao WhatsApp da sua empresa">
 <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

 {/* Passo 1 */}
 <Passo num="1" cor="#818cf8" titulo="Acessar o painel da Evolution API">
 <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginBottom: 10, lineHeight: 1.6 }}>
 Abra o painel da Evolution API da plataforma. Voce vai criar uma instancia exclusiva para o agente da sua empresa.
 </p>
 <a href="https://evolution.oito7digital.com.br" target="_blank" rel="noreferrer"
 style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(79,70,229,0.3)', color: '#818cf8', borderRadius: 7, padding: '8px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
 Abrir evolution.oito7digital.com.br
 </a>
 </Passo>

 {/* Passo 2 */}
 <Passo num="2" cor="#818cf8" titulo='Criar uma nova instancia'>
 <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', lineHeight: 1.6 }}>
 No painel da Evolution API, clique em <strong style={{ color: 'var(--avp-text)' }}>Create Instance</strong>. Escolha um nome curto e unico para identificar esta empresa, por exemplo: <code style={{ background: 'var(--avp-black)', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>assoc-xyz</code> ou <code style={{ background: 'var(--avp-black)', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>autovale-rj</code>. Confirme a criacao.
 </p>
 </Passo>

 {/* Passo 3 */}
 <Passo num="3" cor="#25d366" titulo="Conectar o numero de WhatsApp via QR Code">
 <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', lineHeight: 1.6, marginBottom: 8 }}>
 Com a instancia criada, clique em <strong style={{ color: 'var(--avp-text)' }}>Connect</strong>. Um QR Code vai aparecer. Abra o WhatsApp no celular que sera o numero do agente:
 </p>
 <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
 {[
 'No WhatsApp, toque nos tres pontos (menu) e acesse Dispositivos conectados',
 'Toque em Conectar um dispositivo',
 'Aponte a camera para o QR Code na tela',
 'Aguarde aparecer o status Connected — o numero esta ativo',
 ].map((s, i) => (
 <li key={i} style={{ fontSize: 12, color: 'var(--avp-text-dim)', lineHeight: 1.6 }}>{s}</li>
 ))}
 </ol>
 <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, padding: '10px 14px', marginTop: 10 }}>
 <p style={{ fontSize: 12, color: '#fbbf24', lineHeight: 1.6, margin: 0 }}>
 Use um numero de celular dedicado ao agente — nao o seu pessoal. O numero precisa estar ativo e com WhatsApp instalado. WhatsApp Business com restricoes de API pode nao funcionar.
 </p>
 </div>
 </Passo>

 {/* Passo 4 */}
 <Passo num="4" cor="#fbbf24" titulo="Configurar o webhook na instancia">
 <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', lineHeight: 1.6, marginBottom: 10 }}>
 Na instancia criada, va em <strong style={{ color: 'var(--avp-text)' }}>Webhook</strong> e configure:
 </p>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
 <div style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '12px 14px' }}>
 <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--avp-text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>URL do Webhook</p>
 <WebhookUrl />
 </div>
 <div style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '12px 14px' }}>
 <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--avp-text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Evento a habilitar</p>
 <code style={{ fontSize: 13, color: '#4ade80', fontFamily: 'monospace' }}>messages.upsert</code>
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>Somente este evento. Os demais podem ficar desabilitados.</p>
 </div>
 </div>
 </Passo>

 {/* Passo 5 */}
 <Passo num="5" cor="#4ade80" titulo="Colocar o numero do WhatsApp nesta pagina">
 <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', lineHeight: 1.6 }}>
 Volte ao formulario de <strong style={{ color: 'var(--avp-text)' }}>Configuracao do Assistente</strong> acima. No campo <strong style={{ color: 'var(--avp-text)' }}>Numero WhatsApp do Agente</strong>, informe o numero do celular que voce conectou (somente digitos, com DDI 55). Salve.
 </p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginTop: 8 }}>
 Exemplo: se o numero e <strong>(87) 99999-0000</strong>, informe <code style={{ background: 'var(--avp-black)', padding: '1px 6px', borderRadius: 4 }}>5587999990000</code>
 </p>
 </Passo>

 {/* Passo 6 */}
 <Passo num="6" cor="#4ade80" titulo="Testar — o PRO ja pode usar">
 <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', lineHeight: 1.6 }}>
 Pronto. No painel PRO, o card do Agente IA aparece com o botao <strong style={{ color: '#25d366' }}>Abrir Chat</strong>. O PRO clica, o WhatsApp abre com o numero configurado, ele manda uma mensagem e o agente responde em segundos. Nenhuma outra configuracao e necessaria.
 </p>
 </Passo>

 </div>
 </SectionCard>

 {/* ── Custos por ação ── */}
 <SectionCard title="Custo por Ação" desc="Quantidade de créditos consumidos por tipo de uso">
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
 {Object.entries(custosRef).map(([acao, custo]) => (
 <div key={acao} style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
 <p style={{ fontWeight: 800, fontSize: 22, color: custo>= 5 ? '#818cf8' : custo>= 3 ? '#60a5fa' : 'var(--avp-green)', margin: '0 0 4px' }}>{custo}</p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', textTransform: 'capitalize', margin: 0 }}>{acao.replace('_', ' ')}</p>
 </div>
 ))}
 </div>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginTop: 12 }}>
 Os valores acima são fixos no código. Comparação usa Claude Sonnet (mais inteligente), demais usam Haiku.
 </p>
 </SectionCard>

 {/* ── Argumentos competitivos ── */}
 <SectionCard title="Diferenciais e Argumentos" desc="O agente usa estes pontos para defender a AutoVale nas comparações de cotações">
 {msgArg && (
 <p style={{ marginBottom: 12, fontSize: 13, fontWeight: 600, color: msgArg.includes('Erro') ? 'var(--avp-danger)' : 'var(--avp-green)' }}>{msgArg}</p>
 )}

 <form onSubmit={adicionarArgumento} style={{ display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: 10, marginBottom: 20, alignItems: 'flex-end' }}>
 <div>
 <label style={lbl}>Categoria</label>
 <input style={inp} value={novoArg.categoria} onChange={e => setNovoArg(p => ({ ...p, categoria: e.target.value }))} placeholder="ex: cobertura" required />
 </div>
 <div>
 <label style={lbl}>Argumento</label>
 <input style={inp} value={novoArg.argumento} onChange={e => setNovoArg(p => ({ ...p, argumento: e.target.value }))} placeholder="ex: Cobrimos reboque sem franquia em toda rede credenciada" required />
 </div>
 <button type="submit" disabled={salvandoArg} className="btn btn-green btn-sm" style={{ height: 40, whiteSpace: 'nowrap' as const }}>
 {salvandoArg ? '...' : '+ Adicionar'}
 </button>
 </form>

 {argumentos.length === 0 ? (
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
 Nenhum argumento cadastrado. Adicione os diferenciais do seu produto acima.
 </p>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
 {argumentos.map(a => (
 <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--avp-black)', border: `1px solid ${a.ativo ? 'var(--avp-border)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 8, padding: '10px 14px', opacity: a.ativo ? 1 : 0.5 }}>
 <span style={{ fontSize: 11, background: 'rgba(99,102,241,0.15)', color: '#818cf8', borderRadius: 4, padding: '2px 8px', fontWeight: 600, flexShrink: 0 }}>{a.categoria}</span>
 <p style={{ flex: 1, fontSize: 13, color: 'var(--avp-text)', margin: 0 }}>{a.argumento}</p>
 <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
 <button onClick={() => toggleArgumento(a.id, !a.ativo)}
 style={{ background: a.ativo ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: a.ativo ? 'var(--avp-green)' : 'var(--avp-text-dim)', fontWeight: 600 }}>
 {a.ativo ? 'Ativo' : 'Inativo'}
 </button>
 <button onClick={() => excluirArgumento(a.id)}
 style={{ background: 'rgba(230,57,70,0.1)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: 'var(--avp-danger)', fontWeight: 600 }}>
 Excluir
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </SectionCard>

 {/* ── Pacotes de créditos ── */}
 <SectionCard title="Pacotes de Créditos" desc="Opções que o consultor PRO vai ver ao recarregar via WhatsApp ou painel">
 {msgPacote && (
 <p style={{ marginBottom: 12, fontSize: 13, fontWeight: 600, color: msgPacote.includes('Erro') ? 'var(--avp-danger)' : 'var(--avp-green)' }}>{msgPacote}</p>
 )}

 <form onSubmit={adicionarPacote} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 110px auto', gap: 10, marginBottom: 20, alignItems: 'flex-end' }}>
 <div>
 <label style={lbl}>Nome</label>
 <input style={inp} value={novoPacote.nome} onChange={e => setNovoPacote(p => ({ ...p, nome: e.target.value }))} placeholder="Básico" required />
 </div>
 <div>
 <label style={lbl}>Créditos</label>
 <input type="number" style={inp} min={1} value={novoPacote.creditos} onChange={e => setNovoPacote(p => ({ ...p, creditos: e.target.value }))} placeholder="100" required />
 </div>
 <div>
 <label style={lbl}>Valor (R$)</label>
 <input type="number" style={inp} min={1} step={0.01} value={novoPacote.valor} onChange={e => setNovoPacote(p => ({ ...p, valor: e.target.value }))} placeholder="10.00" required />
 </div>
 <button type="submit" disabled={salvandoPacote} className="btn btn-green btn-sm" style={{ height: 40, whiteSpace: 'nowrap' as const }}>
 {salvandoPacote ? '...' : '+ Adicionar'}
 </button>
 </form>

 {pacotes.length === 0 ? (
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
 Nenhum pacote cadastrado. Sem pacotes os PROs não podem recarregar créditos.
 </p>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
 {pacotes.map(p => (
 <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--avp-black)', border: `1px solid ${p.ativo ? 'var(--avp-border)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 8, padding: '12px 16px', opacity: p.ativo ? 1 : 0.5 }}>
 <div style={{ flex: 1 }}>
 <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{p.nome}</p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>
 {p.creditos} créditos — R$ {Number(p.valor).toFixed(2).replace('.', ',')}
 <span style={{ marginLeft: 8, color: '#6366f1' }}>
 (R$ {(Number(p.valor) / p.creditos).toFixed(3).replace('.', ',')} / crédito)
 </span>
 </p>
 </div>
 <div style={{ display: 'flex', gap: 6 }}>
 <button onClick={() => togglePacote(p.id, !p.ativo)}
 style={{ background: p.ativo ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: p.ativo ? 'var(--avp-green)' : 'var(--avp-text-dim)', fontWeight: 600 }}>
 {p.ativo ? 'Ativo' : 'Inativo'}
 </button>
 <button onClick={() => excluirPacote(p.id)}
 style={{ background: 'rgba(230,57,70,0.1)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: 'var(--avp-danger)', fontWeight: 600 }}>
 Excluir
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </SectionCard>
 </div>
 )
}
