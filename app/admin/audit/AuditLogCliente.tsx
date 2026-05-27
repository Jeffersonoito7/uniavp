'use client'

import { useState, useEffect, useCallback } from 'react'

type LogEntry = {
  id: string
  acao: string
  entidade: string
  entidade_id: string | null
  usuario_tipo: string | null
  ip: string | null
  created_at: string
  dados_anteriores: Record<string, unknown> | null
  dados_novos: Record<string, unknown> | null
}

const ACOES = [
  'aluno.criado', 'aluno.deletado', 'aluno.status_alterado', 'aluno.senha_resetada',
  'contrato.assinado', 'contrato.pdf_gerado',
  'pagamento.confirmado', 'pagamento.expirado',
  'gestor.ativado', 'gestor.suspenso', 'gestor.deletado',
  'admin.configuracao_alterada', 'auth.login', 'auth.orfao_deletado',
]

export default function AuditLogCliente() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [acao, setAcao] = useState('')
  const [busca, setBusca] = useState('')
  const [detalhe, setDetalhe] = useState<LogEntry | null>(null)
  const [loading, setLoading] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (acao) params.set('acao', acao)
      if (busca) params.set('busca', busca)
      const res = await fetch(`/api/admin/audit?${params}`)
      const data = await res.json()
      setLogs(data.logs ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [page, acao, busca])

  useEffect(() => { carregar() }, [carregar])

  const totalPages = Math.ceil(total / 50)

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          value={acao}
          onChange={e => { setAcao(e.target.value); setPage(1) }}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--avp-border)', background: 'var(--avp-card)', color: 'var(--avp-text)', fontSize: 13 }}
        >
          <option value="">Todas as ações</option>
          {ACOES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <input
          placeholder="Buscar por ID..."
          value={busca}
          onChange={e => { setBusca(e.target.value); setPage(1) }}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--avp-border)', background: 'var(--avp-card)', color: 'var(--avp-text)', fontSize: 13, width: 200 }}
        />
        <button
          onClick={carregar}
          style={{ padding: '6px 14px', borderRadius: 6, background: 'var(--avp-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}
        >
          Atualizar
        </button>
        <span style={{ color: 'var(--avp-text-dim)', fontSize: 13, alignSelf: 'center' }}>
          {total} registro{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabela */}
      {loading ? (
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Carregando...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--avp-border)' }}>
                {['Data', 'Ação', 'Entidade', 'ID', 'Tipo', 'IP', ''].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--avp-text-dim)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 20, color: 'var(--avp-text-dim)', textAlign: 'center' }}>Nenhum registro encontrado.</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--avp-border)' }}>
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', color: 'var(--avp-text-dim)' }}>
                    {new Date(log.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      background: log.acao.includes('deletado') || log.acao.includes('suspenso') ? '#fef2f2' : log.acao.includes('criado') || log.acao.includes('confirmado') ? '#f0fdf4' : '#f8fafc',
                      color: log.acao.includes('deletado') || log.acao.includes('suspenso') ? '#dc2626' : log.acao.includes('criado') || log.acao.includes('confirmado') ? '#16a34a' : 'var(--avp-text)',
                      padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                    }}>{log.acao}</span>
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--avp-text-dim)' }}>{log.entidade}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 11, color: 'var(--avp-text-dim)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.entidade_id ?? '—'}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--avp-text-dim)' }}>{log.usuario_tipo ?? '—'}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 11, color: 'var(--avp-text-dim)' }}>{log.ip ?? '—'}</td>
                  <td style={{ padding: '8px 12px' }}>
                    {(log.dados_anteriores || log.dados_novos) && (
                      <button
                        onClick={() => setDetalhe(log)}
                        style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid var(--avp-border)', background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--avp-text-dim)' }}
                      >
                        Detalhes
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid var(--avp-border)', background: 'transparent', cursor: 'pointer', fontSize: 13, opacity: page === 1 ? 0.4 : 1 }}>
            Anterior
          </button>
          <span style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>Página {page} de {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid var(--avp-border)', background: 'transparent', cursor: 'pointer', fontSize: 13, opacity: page === totalPages ? 0.4 : 1 }}>
            Próxima
          </button>
        </div>
      )}

      {/* Modal de detalhes */}
      {detalhe && (
        <div
          onClick={() => setDetalhe(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--avp-card)', borderRadius: 12, padding: 24, maxWidth: 560, width: '90%', maxHeight: '80vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{detalhe.acao}</h3>
              <button onClick={() => setDetalhe(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--avp-text-dim)' }}>×</button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '0 0 16px' }}>
              {detalhe.entidade} / {detalhe.entidade_id} — {new Date(detalhe.created_at).toLocaleString('pt-BR')}
            </p>
            {detalhe.dados_anteriores && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', margin: '0 0 6px' }}>Antes:</p>
                <pre style={{ background: 'var(--avp-bg)', padding: 12, borderRadius: 6, fontSize: 11, overflow: 'auto', margin: 0 }}>
                  {JSON.stringify(detalhe.dados_anteriores, null, 2)}
                </pre>
              </div>
            )}
            {detalhe.dados_novos && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', margin: '0 0 6px' }}>Depois:</p>
                <pre style={{ background: 'var(--avp-bg)', padding: 12, borderRadius: 6, fontSize: 11, overflow: 'auto', margin: 0 }}>
                  {JSON.stringify(detalhe.dados_novos, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
