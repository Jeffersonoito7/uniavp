'use client'
import { useState } from 'react'

type Contrato = {
  id: string; nome: string; cpf: string | null; whatsapp: string; email: string | null
  cnpj_mei: string | null; sede_mei: string | null; numero_registro: string | null
  assinado_em: string; hash_contrato: string | null; pdf_url: string | null; pdf_status: string | null
}

function mascaraCPF(cpf: string | null) {
  if (!cpf) return '—'
  const d = cpf.replace(/\D/g,'')
  return d.length===11 ? `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}` : cpf
}

function mascaraCNPJ(cnpj: string | null) {
  if (!cnpj) return '—'
  const d = cnpj.replace(/\D/g,'')
  return d.length===14 ? `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}` : cnpj
}

function mascaraWpp(w: string) {
  const d = w.replace(/\D/g,'')
  if (d.length===11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  if (d.length===13) return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`
  return w
}

export default function ContratosCliente({ contratosIniciais, total }: { contratosIniciais: Contrato[]; total: number }) {
  const [lista] = useState(contratosIniciais)
  const [busca, setBusca] = useState('')

  const mes = new Date()
  const esteMes = lista.filter(c => {
    const d = new Date(c.assinado_em)
    return d.getMonth() === mes.getMonth() && d.getFullYear() === mes.getFullYear()
  }).length

  const comPDF = lista.filter(c => c.pdf_url).length

  const filtrada = lista.filter(c =>
    !busca ||
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.numero_registro || '').includes(busca) ||
    (c.email || '').toLowerCase().includes(busca.toLowerCase()) ||
    (c.cnpj_mei || '').includes(busca.replace(/\D/g,''))
  )

  return (
    <>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>📄 Contratos de Representação</h1>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>
            Contratos assinados digitalmente — {total} total
          </p>
        </div>
        <a href="/contrato" target="_blank" rel="noreferrer"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
          🔗 Abrir página do contrato
        </a>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total assinados', value: total, cor: '#6366f1' },
          { label: 'Este mês', value: esteMes, cor: '#22c55e' },
          { label: 'Com PDF gerado', value: comPDF, cor: '#c8a535' },
          { label: 'Pendente PDF', value: total - comPDF, cor: '#f87171' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, padding: '16px 20px' }}>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 30, fontWeight: 800, color: s.cor, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Busca */}
      <div style={{ marginBottom: 16 }}>
        <input
          value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome, registro, e-mail ou CNPJ..."
          style={{ width: '100%', background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Tabela */}
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--avp-border)', background: 'rgba(255,255,255,0.02)' }}>
                {['Registro', 'Nome', 'CPF', 'CNPJ MEI', 'WhatsApp', 'E-mail', 'Assinado em', 'PDF', 'Hash'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: 'var(--avp-text-dim)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrada.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--avp-text-dim)' }}>Nenhum resultado</td></tr>
              ) : filtrada.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--avp-border)' }}>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontFamily: 'monospace', color: '#6366f1', fontWeight: 700, fontSize: 12 }}>{c.numero_registro || '—'}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--avp-text)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: 'var(--avp-text-dim)', whiteSpace: 'nowrap' }}>{mascaraCPF(c.cpf)}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: 'var(--avp-text-dim)', whiteSpace: 'nowrap', fontSize: 11 }}>{mascaraCNPJ(c.cnpj_mei)}</td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <a href={`https://wa.me/${c.whatsapp.replace(/\D/g,'').startsWith('55') ? c.whatsapp.replace(/\D/g,'') : '55'+c.whatsapp.replace(/\D/g,'')}`}
                      target="_blank" rel="noreferrer" style={{ color: '#22c55e', textDecoration: 'none' }}>
                      {mascaraWpp(c.whatsapp)}
                    </a>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--avp-text-dim)', fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email || '—'}</td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: 'var(--avp-text-dim)', fontSize: 11 }}>
                    {new Date(c.assinado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {c.pdf_url ? (
                      <a href={c.pdf_url} target="_blank" rel="noreferrer"
                        style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                        📄 PDF
                      </a>
                    ) : (
                      <span style={{ color: 'var(--avp-text-dim)', fontSize: 11 }}>
                        {c.pdf_status === 'pendente' ? '⏳' : c.pdf_status === 'erro' ? '❌' : '—'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px', maxWidth: 130 }}>
                    {c.hash_contrato ? (
                      <span title={c.hash_contrato} style={{ fontFamily: 'monospace', color: 'var(--avp-text-dim)', fontSize: 10, cursor: 'help' }}>
                        {c.hash_contrato.slice(0, 12)}…
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
