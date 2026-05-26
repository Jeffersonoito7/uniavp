'use client'
import { useState } from 'react'

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
              <input type="checkbox" id="agenteAtivo" checked={cfg.ativo} onChange={e => setCfg(p => ({ ...p, ativo: e.target.checked }))}
                style={{ width: 18, height: 18, marginTop: 2, cursor: 'pointer' }} />
              <label htmlFor="agenteAtivo" style={{ fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Agente ativo
                <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', fontWeight: 400, margin: '2px 0 0' }}>
                  Desative para pausar o agente sem perder as configurações
                </p>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
            <button type="submit" disabled={salvandoCfg} className="btn btn-green btn-sm">
              {salvandoCfg ? 'Salvando...' : '✓ Salvar configuração'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ── Custos por ação ── */}
      <SectionCard title="Custo por Ação" desc="Quantidade de créditos consumidos por tipo de uso">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {Object.entries(custosRef).map(([acao, custo]) => (
            <div key={acao} style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
              <p style={{ fontWeight: 800, fontSize: 22, color: custo >= 5 ? '#818cf8' : custo >= 3 ? '#60a5fa' : 'var(--avp-green)', margin: '0 0 4px' }}>{custo}</p>
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
