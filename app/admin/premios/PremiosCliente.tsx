'use client'
import { useState } from 'react'

type Premio = {
  id: string
  nome: string
  descricao: string | null
  custo_pontos: number
  quantidade_disponivel: number | null
  ativo: boolean
}

type Resgate = {
  id: string
  status: string
  created_at: string
  aluno: { nome: string }
  premio: { nome: string }
}

export default function PremiosCliente({ premiosIniciais, resgatesIniciais }: { premiosIniciais: Premio[], resgatesIniciais: Resgate[] }) {
  const [premios, setPremios] = useState<Premio[]>(premiosIniciais)
  const [resgates, setResgates] = useState<Resgate[]>(resgatesIniciais)
  const [form, setForm] = useState({ nome: '', descricao: '', custo_pontos: 100, quantidade_disponivel: '' })
  const [criando, setCriando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')

  async function criarPremio(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    const res = await fetch('/api/admin/premios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome,
        descricao: form.descricao,
        custo_pontos: form.custo_pontos,
        quantidade_disponivel: form.quantidade_disponivel ? parseInt(form.quantidade_disponivel) : null,
      }),
    })
    const data = await res.json()
    if (data.premio) {
      setPremios(p => [data.premio, ...p])
      setForm({ nome: '', descricao: '', custo_pontos: 100, quantidade_disponivel: '' })
      setCriando(false)
      setMsg('Prêmio criado com sucesso!')
    }
    setSalvando(false)
    setTimeout(() => setMsg(''), 3000)
  }

  async function atualizarResgate(id: string, status: string) {
    await fetch('/api/admin/premios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setResgates(r => r.map(x => x.id === id ? { ...x, status } : x))
  }

  const cardStyle = { background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20 }
  const inputStyle = { width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none' }
  const labelStyle = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {msg && <div style={{ padding: '12px 16px', background: '#02A15320', border: '1px solid var(--avp-green)', borderRadius: 8, color: 'var(--avp-green)', fontSize: 14 }}>{msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Prêmios Cadastrados</h2>
        <button onClick={() => setCriando(c => !c)} style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          {criando ? 'Cancelar' : '+ Novo Prêmio'}
        </button>
      </div>

      {criando && (
        <form onSubmit={criarPremio} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Novo Prêmio</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Nome *</label>
              <input style={inputStyle} value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} required />
            </div>
            <div>
              <label style={labelStyle}>Custo em Pontos *</label>
              <input type="number" style={inputStyle} value={form.custo_pontos} onChange={e => setForm(p => ({ ...p, custo_pontos: parseInt(e.target.value) }))} required />
            </div>
            <div>
              <label style={labelStyle}>Descrição</label>
              <input style={inputStyle} value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Quantidade disponível (deixe vazio = ilimitado)</label>
              <input type="number" style={inputStyle} value={form.quantidade_disponivel} onChange={e => setForm(p => ({ ...p, quantidade_disponivel: e.target.value }))} />
            </div>
          </div>
          <button type="submit" disabled={salvando} style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14, alignSelf: 'flex-start' }}>
            {salvando ? 'Salvando...' : 'Criar Prêmio'}
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {premios.map(p => (
          <div key={p.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>{p.nome}</h3>
              <span style={{ background: '#02A15320', color: 'var(--avp-green)', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>{p.custo_pontos} pts</span>
            </div>
            {p.descricao && <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 8 }}>{p.descricao}</p>}
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 12 }}>
              Estoque: {p.quantidade_disponivel ?? 'Ilimitado'}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Resgates Pendentes</h2>
        {resgates.filter(r => r.status === 'pendente').length === 0 && (
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Nenhum resgate pendente.</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {resgates.filter(r => r.status === 'pendente').map(r => (
            <div key={r.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 15 }}>{r.aluno?.nome}</p>
                <p style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>Prêmio: {r.premio?.nome}</p>
                <p style={{ color: 'var(--avp-text-dim)', fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => atualizarResgate(r.id, 'aprovado')} style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Aprovar</button>
                <button onClick={() => atualizarResgate(r.id, 'entregue')} style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Entregue</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
