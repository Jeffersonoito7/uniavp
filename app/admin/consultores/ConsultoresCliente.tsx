'use client'
import { useState } from 'react'
import ImportarXLS from './ImportarXLS'

type Consultor = {
  id: string
  nome: string
  whatsapp: string
  email: string
  status: string
  created_at: string
  indicador: { nome: string } | null
}

const statusColor: Record<string, string> = {
  ativo: '#02A153',
  pausado: '#f59e0b',
  concluido: '#333687',
  desligado: '#e63946',
}

export default function ConsultoresCliente({ consultoresIniciais }: { consultoresIniciais: Consultor[] }) {
  const [consultores] = useState<Consultor[]>(consultoresIniciais)
  const [showImport, setShowImport] = useState(false)
  const [busca, setBusca] = useState('')

  const filtrados = consultores.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.whatsapp.includes(busca) ||
    c.email.toLowerCase().includes(busca.toLowerCase())
  )

  const cardStyle = { background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12 }
  const inputStyle = { background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', width: 280 }

  return (
    <>
      {showImport && <ImportarXLS onClose={() => setShowImport(false)} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <input
          placeholder="Buscar por nome, WhatsApp ou e-mail..."
          style={inputStyle}
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <button
          onClick={() => setShowImport(true)}
          style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
        >
          Importar XLS
        </button>
      </div>
      <div style={cardStyle}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--avp-border)' }}>
                {['Nome', 'WhatsApp', 'E-mail', 'Indicador', 'Status', 'Cadastro'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--avp-border)' }}>
                  <td style={{ padding: '14px 16px', color: 'var(--avp-text)', fontWeight: 600, fontSize: 14 }}>{c.nome}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 14 }}>{c.whatsapp}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 14 }}>{c.email}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 14 }}>{c.indicador?.nome ?? '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: statusColor[c.status] + '20', color: statusColor[c.status], borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 13 }}>
                    {new Date(c.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--avp-text-dim)' }}>Nenhum consultor encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
