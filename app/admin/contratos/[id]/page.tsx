'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import AdminLayout from '../../AdminLayout'
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'

type Assinante = { id: string; nome: string; email: string | null; whatsapp: string | null; papel: string; status: string; assinado_em: string | null; token_acesso: string }
type Contrato = {
  id: string; titulo: string; numero_registro: string; status: string; tipo: string
  corpo_renderizado: string; created_at: string; hash_final: string | null
  assinatura_avp_url: string | null; assinado_avp_em: string | null
  assinantes: Assinante[]
  aditivos: { id: string; titulo: string; numero_registro: string; status: string }[]
}

const statusCor: Record<string, string> = {
  pendente: '#f59e0b', visualizado: '#3b82f6', assinado: '#02A153', recusado: '#e63946',
}
const statusContratoLabel: Record<string, string> = {
  rascunho: 'Rascunho', enviado: 'Aguardando assinaturas', parcialmente_assinado: 'Parcialmente assinado',
  concluido: 'Concluido', cancelado: 'Cancelado',
}

export default function DetalheContratoPage() {
  const { id } = useParams<{ id: string }>()
  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [loading, setLoading] = useState(true)
  const [acao, setAcao] = useState('')

  useEffect(() => {
    fetch(`/api/admin/contratos-digitais/${id}`)
      .then(r => r.json())
      .then(d => { setContrato(d.contrato); setLoading(false) })
  }, [id])

  async function reenviar(assinante_id: string) {
    setAcao(assinante_id)
    await fetch(`/api/admin/contratos-digitais/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reenviar_assinante_id: assinante_id }),
    })
    setAcao('')
    alert('Link reenviado por WhatsApp!')
  }

  async function cancelar() {
    if (!confirm('Cancelar este contrato? Os links de assinatura deixarao de funcionar.')) return
    await fetch(`/api/admin/contratos-digitais/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancelar: true }),
    })
    setContrato(prev => prev ? { ...prev, status: 'cancelado' } : prev)
  }

  if (loading) return <AdminLayout><p style={{ color: 'var(--avp-text-dim)', padding: 40, textAlign: 'center' }}>Carregando...</p></AdminLayout>
  if (!contrato) return <AdminLayout><p style={{ color: 'var(--avp-danger)', padding: 40, textAlign: 'center' }}>Contrato não encontrado.</p></AdminLayout>

  const statusCorContrato: Record<string, string> = { rascunho: '#6b7280', enviado: '#f59e0b', parcialmente_assinado: '#3b82f6', concluido: '#02A153', cancelado: '#e63946' }
  const card: React.CSSProperties = { background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20, marginBottom: 20 }

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <Link href="/admin/contratos" style={{ color: 'var(--avp-text-dim)', fontSize: 13, textDecoration: 'none' }}>← Contratos</Link>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--avp-text)', marginTop: 6 }}>{contrato.titulo}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--avp-text-dim)' }}>N. {contrato.numero_registro}</span>
            <span style={{ background: (statusCorContrato[contrato.status] ?? '#6b7280') + '20', color: statusCorContrato[contrato.status] ?? '#6b7280', border: `1px solid ${(statusCorContrato[contrato.status] ?? '#6b7280')}40`, borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
              {statusContratoLabel[contrato.status] ?? contrato.status}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href={`/admin/contratos/novo?base=${contrato.id}`} style={{ background: 'var(--avp-blue)', color: '#fff', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            + Aditivo
          </Link>
          {contrato.status !== 'cancelado' && contrato.status !== 'concluido' && (
            <button onClick={cancelar} style={{ background: 'none', border: '1px solid var(--avp-danger)', color: 'var(--avp-danger)', borderRadius: 8, padding: '8px 18px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
              Cancelar contrato
            </button>
          )}
        </div>
      </div>

      {/* Assinantes */}
      <div style={card}>
        <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Assinantes</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* AVP pre-assinada */}
          <div style={{ background: 'var(--avp-black)', border: '1px solid #02A15340', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 2px' }}>AutoVale Prevencoes (Contratante)</p>
              <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0 }}>Pre-assinada pelo presidente</p>
            </div>
            <span style={{ background: '#02A15320', color: '#02A153', border: '1px solid #02A15340', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>Assinado</span>
          </div>

          {contrato.assinantes.map(a => (
            <div key={a.id} style={{ background: 'var(--avp-black)', border: `1px solid ${(statusCor[a.status] ?? '#6b7280')}40`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{a.nome}</p>
                  <span style={{ background: '#6b728020', color: '#6b7280', borderRadius: 6, padding: '1px 6px', fontSize: 11 }}>{a.papel === 'destinatario' ? 'Destinatario' : 'Terceiro'}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0 }}>
                  {a.whatsapp && <>{a.whatsapp}</>}
                  {a.email && <> · {a.email}</>}
                  {a.assinado_em && <> · Assinou em {new Date(a.assinado_em).toLocaleDateString('pt-BR')}</>}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                <span style={{ background: (statusCor[a.status] ?? '#6b7280') + '20', color: statusCor[a.status] ?? '#6b7280', border: `1px solid ${(statusCor[a.status] ?? '#6b7280')}40`, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {a.status === 'pendente' ? 'Aguardando' : a.status === 'visualizado' ? 'Visualizou' : a.status === 'assinado' ? 'Assinado' : a.status}
                </span>
                {a.status !== 'assinado' && a.whatsapp && (
                  <button onClick={() => reenviar(a.id)} disabled={acao === a.id} style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: acao === a.id ? 0.6 : 1 }}>
                    {acao === a.id ? '...' : 'Reenviar'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hash de integridade */}
      {contrato.hash_final && (
        <div style={card}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Hash de integridade</p>
          <p style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--avp-text-dim)', wordBreak: 'break-all', margin: 0 }}>{contrato.hash_final}</p>
          <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginTop: 6 }}>SHA-256 gerado automaticamente apos todas as assinaturas. Garante que o documento nao foi alterado.</p>
        </div>
      )}

      {/* Aditivos */}
      {contrato.aditivos?.length > 0 && (
        <div style={card}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Aditivos</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {contrato.aditivos.map(a => (
              <Link key={a.id} href={`/admin/contratos/${a.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '12px 16px', textDecoration: 'none', color: 'var(--avp-text)' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{a.titulo}</p>
                  <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '2px 0 0', fontFamily: 'monospace' }}>{a.numero_registro}</p>
                </div>
                <span style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>Ver →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Preview do corpo */}
      {contrato.corpo_renderizado && (
        <div style={{ ...card, marginTop: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Conteudo do contrato</p>
          <div style={{ background: '#fff', borderRadius: 10, padding: '28px 32px', color: '#111', fontSize: 14, lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contrato.corpo_renderizado) }} />
        </div>
      )}
    </AdminLayout>
  )
}
