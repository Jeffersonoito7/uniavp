'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type AulaNav = { id: string; titulo: string; ordem: number }

type Props = {
  whatsapp: string
  aulaAnterior: AulaNav | null
  proximaAula: AulaNav | null
  proximaStatus: string
}

export default function NavegacaoAulas({ whatsapp, aulaAnterior, proximaAula, proximaStatus }: Props) {
  const router = useRouter()
  const [verificando, setVerificando] = useState(false)

  const disponivel = proximaStatus === 'disponivel' || proximaStatus === 'concluida'

  async function verificarProxima() {
    setVerificando(true)
    router.refresh()
    setTimeout(() => setVerificando(false), 2000)
  }

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8,
    borderRadius: 10, padding: '12px 20px', fontWeight: 700,
    fontSize: 14, textDecoration: 'none', cursor: 'pointer',
    border: 'none', transition: 'all 0.15s',
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '20px 24px', borderTop: '1px solid var(--avp-border)', flexWrap: 'wrap' }}>

      {/* ← Anterior */}
      {aulaAnterior ? (
        <Link href={`/aluno/${whatsapp}/aula/${aulaAnterior.id}`}
          style={{ ...btnBase, background: 'var(--avp-card)', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', maxWidth: '48%' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {aulaAnterior.ordem}. {aulaAnterior.titulo}
          </span>
        </Link>
      ) : <div />}

      {/* Próxima → */}
      {proximaAula && (
        disponivel ? (
          <Link href={`/aluno/${whatsapp}/aula/${proximaAula.id}`}
            style={{ ...btnBase, background: 'var(--avp-green)', color: '#fff', marginLeft: 'auto', maxWidth: '48%' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {proximaAula.ordem}. {proximaAula.titulo}
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}><polyline points="9,18 15,12 9,6"/></svg>
          </Link>
        ) : (
          <button onClick={verificarProxima} disabled={verificando}
            style={{ ...btnBase, background: verificando ? 'var(--avp-border)' : 'var(--avp-blue)', color: '#fff', marginLeft: 'auto', opacity: verificando ? 0.7 : 1 }}>
            {verificando
              ? <><span style={{ fontSize: 16 }}>⏳</span> Verificando...</>
              : <><span style={{ fontSize: 16 }}>🔒</span> Verificar próxima aula<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}><polyline points="9,18 15,12 9,6"/></svg></>}
          </button>
        )
      )}

      {/* Sem próxima aula = fim do módulo */}
      {!proximaAula && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--avp-green)', fontSize: 14, fontWeight: 700 }}>
          <span>🎯</span> Módulo concluído!
        </div>
      )}
    </div>
  )
}
