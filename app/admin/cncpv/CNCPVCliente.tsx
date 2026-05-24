'use client'
import { useState } from 'react'
import Link from 'next/link'

type Assinatura = {
  id: string; nome: string; cpf: string | null; whatsapp: string | null; email: string | null
  numero_registro: string | null; assinado_em: string | null; hash_contrato: string | null
  pdf_url: string | null; pdf_status: string | null; status: string | null
  revogado_em: string | null; revogado_motivo: string | null
}

function mascaraCPF(cpf: string | null) {
  if (!cpf) return '—'
  const d = cpf.replace(/\D/g, '')
  return d.length === 11 ? `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}` : cpf
}
function mascaraWpp(w: string) {
  const d = w.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  if (d.length === 13) return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`
  return w
}
function wppLink(w: string) {
  const d = w.replace(/\D/g, '')
  return `https://wa.me/${d.startsWith('55') ? d : '55' + d}`
}

export default function CNCPVCliente({ assinaturasIniciais, total }: { assinaturasIniciais: Assinatura[]; total: number }) {
  const [lista, setLista] = useState(assinaturasIniciais)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<'todas' | 'ativas' | 'revogadas'>('todas')
  const [modal, setModal] = useState<{ registro: string; nome: string; acao: 'revogar' | 'reativar' } | null>(null)
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState('')

  const mes = new Date()
  const emitidosMes = lista.filter(a => {
    if (!a.assinado_em) return false
    const d = new Date(a.assinado_em)
    return d.getMonth() === mes.getMonth() && d.getFullYear() === mes.getFullYear()
  }).length

  const filtrada = lista.filter(a => {
    const buscaOk = !busca || a.nome.toLowerCase().includes(busca.toLowerCase()) || (a.numero_registro ?? '').includes(busca) || (a.email ?? '').toLowerCase().includes(busca.toLowerCase())
    const filtroOk = filtro === 'todas' || (filtro === 'ativas' ? a.status !== 'revogada' : a.status === 'revogada')
    return buscaOk && filtroOk
  })

  async function acionar(registro: string, acao: 'revogar' | 'reativar', motivoText?: string) {
    setLoading(registro)
    const res = await fetch('/api/admin/cncpv', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero_registro: registro, acao, motivo: motivoText }),
    })
    if (res.ok) {
      const novoStatus = acao === 'revogar' ? 'revogada' : 'ativa'
      setLista(l => l.map(a => a.numero_registro === registro ? {
        ...a, status: novoStatus,
        revogado_em: acao === 'revogar' ? new Date().toISOString() : null,
        revogado_motivo: acao === 'revogar' ? (motivoText || 'Revogado pelo administrador') : null,
      } : a))
    }
    setLoading('')
    setModal(null)
    setMotivo('')
  }

  return (
    <>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>🪪 CNCPV</h1>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>
            Carteiras emitidas — {total} total
          </p>
        </div>
        <a href="https://cncpv.com.br" target="_blank" rel="noreferrer"
          style={{ background: 'rgba(2,161,83,0.1)', border: '1px solid rgba(2,161,83,0.3)', color: '#02A153', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
          🌐 cncpv.com.br
        </a>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Emitidas', value: total, cor: '#02A153' },
          { label: 'Ativas', value: lista.filter(a => a.status !== 'revogada').length, cor: '#22c55e' },
          { label: 'Revogadas', value: lista.filter(a => a.status === 'revogada').length, cor: '#f87171' },
          { label: 'Este mês', value: emitidosMes, cor: '#6366f1' },
          { label: 'Com PDF', value: lista.filter(a => a.pdf_url).length, cor: '#c8a535' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, padding: '18px 20px' }}>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 34, fontWeight: 800, color: s.cor, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome, registro ou e-mail..."
          style={{ flex: 1, minWidth: 220, background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '9px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none' }}
        />
        {(['todas', 'ativas', 'revogadas'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            style={{ background: filtro === f ? 'var(--avp-green)' : 'var(--avp-card)', border: `1px solid ${filtro === f ? 'var(--avp-green)' : 'var(--avp-border)'}`, color: filtro === f ? '#fff' : 'var(--avp-text-dim)', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' }}>
            {f === 'todas' ? 'Todas' : f === 'ativas' ? 'Ativas' : 'Revogadas'}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--avp-border)', background: 'rgba(255,255,255,0.02)' }}>
                {['Status', 'Registro', 'Nome', 'CPF', 'WhatsApp', 'E-mail', 'Emissão', 'PDF', 'Hash', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: 'var(--avp-text-dim)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrada.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--avp-text-dim)' }}>Nenhum resultado</td></tr>
              ) : filtrada.map(a => {
                const revogada = a.status === 'revogada'
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--avp-border)', opacity: revogada ? 0.65 : 1 }}>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: revogada ? 'rgba(248,113,113,0.1)' : 'rgba(34,197,94,0.1)', border: `1px solid ${revogada ? 'rgba(248,113,113,0.3)' : 'rgba(34,197,94,0.3)'}`, color: revogada ? '#f87171' : '#22c55e', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                        {revogada ? '🚫 Revogada' : '✓ Ativa'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'monospace', color: '#02A153', fontWeight: 700, fontSize: 12 }}>{a.numero_registro}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--avp-text)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome}</td>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: 'var(--avp-text-dim)', whiteSpace: 'nowrap' }}>{mascaraCPF(a.cpf)}</td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <a href={a.whatsapp ? wppLink(a.whatsapp) : '#'} target="_blank" rel="noreferrer" style={{ color: '#22c55e', textDecoration: 'none' }}>{a.whatsapp ? mascaraWpp(a.whatsapp) : '—'}</a>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--avp-text-dim)', fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.email}</td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: 'var(--avp-text-dim)', fontSize: 11 }}>
                      {a.assinado_em ? new Date(a.assinado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {a.pdf_url ? (
                        <a href={a.pdf_url} target="_blank" rel="noreferrer"
                          style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', color: '#f87171', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
                          📄 PDF
                        </a>
                      ) : (
                        <span style={{ color: 'var(--avp-text-dim)', fontSize: 11 }}>
                          {a.pdf_status === 'pendente' ? '⏳' : a.pdf_status === 'erro' ? '❌' : '—'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {a.hash_contrato ? (
                        <span title={a.hash_contrato} style={{ fontFamily: 'monospace', fontSize: 10, color: '#c8a535', background: 'rgba(200,165,53,0.08)', border: '1px solid rgba(200,165,53,0.2)', borderRadius: 4, padding: '2px 6px' }}>
                          {a.hash_contrato.slice(0, 10)}…
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link href={`/cncpv/verificar/${a.numero_registro ?? ''}`} target="_blank"
                          style={{ color: '#6366f1', fontSize: 11, fontWeight: 700, textDecoration: 'none', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 6, padding: '4px 8px' }}>
                          Ver
                        </Link>
                        {!revogada ? (
                          <button onClick={() => setModal({ registro: a.numero_registro ?? '', nome: a.nome, acao: 'revogar' })}
                            disabled={loading === a.numero_registro}
                            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            Revogar
                          </button>
                        ) : (
                          <button onClick={() => acionar(a.numero_registro ?? '', 'reativar')}
                            disabled={loading === a.numero_registro}
                            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            Reativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal revogar */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32, maxWidth: 440, width: '100%' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f87171', marginBottom: 8 }}>🚫 Revogar Carteira</h2>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
              Você está revogando a carteira de <strong style={{ color: 'var(--avp-text)' }}>{modal.nome}</strong> ({modal.registro}). A página de verificação passará a exibir "Carteira Revogada".
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Motivo</label>
              <textarea
                value={motivo} onChange={e => setMotivo(e.target.value)}
                placeholder="Descreva o motivo da revogação..."
                style={{ width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', minHeight: 80, resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setModal(null); setMotivo('') }}
                style={{ flex: 1, background: 'var(--avp-black)', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '12px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={() => acionar(modal.registro, 'revogar', motivo)}
                style={{ flex: 1, background: '#e63946', border: 'none', color: '#fff', borderRadius: 8, padding: '12px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                Confirmar Revogação
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
