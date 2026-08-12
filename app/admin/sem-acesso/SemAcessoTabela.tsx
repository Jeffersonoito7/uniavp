'use client'
import { useState } from 'react'

type Aluno = {
  id: string
  nome: string
  whatsapp: string | null
  email: string | null
  created_at: string
  gestor_nome: string | null
  gestor_whatsapp: string | null
}

export function SemAcessoTabela({ alunos }: { alunos: Aluno[] }) {
  const [enviando, setEnviando] = useState<Record<string, boolean>>({})
  const [enviados, setEnviados] = useState<Record<string, string>>({})
  const [busca, setBusca] = useState('')

  const filtrados = alunos.filter(a => {
    if (!busca.trim()) return true
    const t = busca.toLowerCase()
    return (
      a.nome.toLowerCase().includes(t) ||
      (a.gestor_nome ?? '').toLowerCase().includes(t) ||
      (a.whatsapp ?? '').includes(t) ||
      (a.email ?? '').toLowerCase().includes(t)
    )
  })

  async function enviarLembrete(aluno: Aluno) {
    if (!aluno.whatsapp) return alert('Aluno sem WhatsApp cadastrado.')
    setEnviando(e => ({ ...e, [aluno.id]: true }))
    try {
      const res = await fetch('/api/admin/sem-acesso/lembrete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aluno_id: aluno.id }),
      })
      const json = await res.json()
      if (!res.ok) {
        alert('Erro: ' + (json.error ?? 'Falha ao enviar'))
      } else {
        setEnviados(e => ({ ...e, [aluno.id]: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }))
      }
    } catch {
      alert('Erro de conexão ao enviar lembrete.')
    } finally {
      setEnviando(e => ({ ...e, [aluno.id]: false }))
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Buscar por nome, gestor, WhatsApp ou e-mail..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            background: 'var(--avp-card)',
            border: '1px solid var(--avp-border)',
            borderRadius: 8,
            color: 'var(--avp-text)',
            fontSize: 14,
            outline: 'none',
          }}
        />
      </div>

      {busca.trim() && (
        <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginBottom: 12 }}>
          {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''} para &quot;{busca}&quot;
        </p>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--avp-border)' }}>
              {['Aluno', 'WhatsApp', 'Gestor responsável', 'Cadastrado em', 'Lembrete'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--avp-text-dim)', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.map(a => {
              const dt = new Date(a.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
              const jaEnviou = enviados[a.id]
              return (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--avp-border)' }}>
                  <td style={{ padding: '10px 12px', color: 'var(--avp-text)', fontWeight: 600 }}>
                    {a.nome}
                    {a.email && <div style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 2 }}>{a.email}</div>}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--avp-text-dim)' }}>
                    {a.whatsapp ?? <span style={{ color: '#f87171', fontSize: 11 }}>Sem WhatsApp</span>}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {a.gestor_nome ? (
                      <div>
                        <span style={{ color: 'var(--avp-text)', fontWeight: 600 }}>{a.gestor_nome}</span>
                        {a.gestor_whatsapp && (
                          <div style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 2 }}>{a.gestor_whatsapp}</div>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--avp-text-dim)' }}>Admin</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--avp-text-dim)', whiteSpace: 'nowrap' }}>{dt}</td>
                  <td style={{ padding: '10px 12px' }}>
                    {jaEnviou ? (
                      <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 600 }}>Enviado {jaEnviou}</span>
                    ) : (
                      <button
                        onClick={() => enviarLembrete(a)}
                        disabled={enviando[a.id] || !a.whatsapp}
                        style={{
                          padding: '5px 12px',
                          background: a.whatsapp ? 'rgba(74,222,128,0.12)' : 'var(--avp-border)',
                          border: `1px solid ${a.whatsapp ? 'rgba(74,222,128,0.35)' : 'var(--avp-border)'}`,
                          borderRadius: 6,
                          color: a.whatsapp ? '#4ade80' : 'var(--avp-text-dim)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: a.whatsapp ? 'pointer' : 'not-allowed',
                          opacity: enviando[a.id] ? 0.6 : 1,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {enviando[a.id] ? 'Enviando...' : 'Enviar lembrete'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '32px 12px', textAlign: 'center', color: 'var(--avp-text-dim)' }}>
                  Nenhum aluno encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
