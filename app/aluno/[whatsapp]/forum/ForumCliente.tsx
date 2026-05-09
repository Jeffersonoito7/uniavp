'use client'
import { useState } from 'react'
import Link from 'next/link'

type Topico = {
  id: string
  titulo: string
  descricao: string | null
  fixado: boolean
  created_at: string
  aluno: { nome: string } | null
  respostas: { count: number }[]
}

export default function ForumCliente({ topicosIniciais, whatsapp, alunoId, alunoNome }: { topicosIniciais: Topico[]; whatsapp: string; alunoId: string; alunoNome: string }) {
  const [topicos, setTopicos] = useState<Topico[]>(topicosIniciais)
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState({ titulo: '', descricao: '' })
  const [salvando, setSalvando] = useState(false)

  async function criarTopico(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    const res = await fetch('/api/forum', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'topico', titulo: form.titulo, descricao: form.descricao }),
    })
    const data = await res.json()
    if (data.topico) {
      setTopicos(t => [{ ...data.topico, aluno: { nome: alunoNome }, respostas: [{ count: 0 }] }, ...t])
      setForm({ titulo: '', descricao: '' })
      setCriando(false)
    }
    setSalvando(false)
  }

  const cardStyle = { background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20 }
  const inputStyle = { width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none' }
  const labelStyle = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Tópicos</h2>
        <button onClick={() => setCriando(c => !c)} style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          {criando ? 'Cancelar' : '+ Novo Tópico'}
        </button>
      </div>

      {criando && (
        <form onSubmit={criarTopico} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Novo Tópico</h3>
          <div>
            <label style={labelStyle}>Título *</label>
            <input style={inputStyle} value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} required />
          </div>
          <div>
            <label style={labelStyle}>Descrição</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'Inter, sans-serif' }} value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
          </div>
          <button type="submit" disabled={salvando} style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14, alignSelf: 'flex-start' }}>
            {salvando ? 'Criando...' : 'Criar Tópico'}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {topicos.map(t => (
          <Link key={t.id} href={`/aluno/${whatsapp}/forum/${t.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ ...cardStyle, cursor: 'pointer', transition: 'border-color 0.15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {t.fixado && <span style={{ fontSize: 14 }}>📌</span>}
                  <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--avp-text)' }}>{t.titulo}</h3>
                </div>
                <span style={{ background: 'var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {t.respostas?.[0]?.count ?? 0} resp.
                </span>
              </div>
              {t.descricao && <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6, lineHeight: 1.4 }}>{t.descricao}</p>}
              <div style={{ display: 'flex', gap: 12, color: 'var(--avp-text-dim)', fontSize: 12 }}>
                <span>{t.aluno?.nome ?? 'Aluno'}</span>
                <span>{new Date(t.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </Link>
        ))}
        {topicos.length === 0 && !criando && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--avp-text-dim)' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>💬</p>
            <p>Seja o primeiro a criar um tópico!</p>
          </div>
        )}
      </div>
    </div>
  )
}
