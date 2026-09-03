'use client'
import { useState } from 'react'
import CertificadoPopup from '@/app/components/CertificadoPopup'

type Props = {
  titulo: string
  nomeAluno: string
  templateUrl: string
  whatsapp: string
  numRegistro?: string
  nomeY?: number
  nomeFontePct?: number
  nomeCor?: string
  nomeEstilo?: string
  logoEsquerdaUrl?: string | null
  logoDireitaUrl?: string | null
  logoY?: number
  logoTamPct?: number
  assinaturaUrl?: string | null
  assinaturaNome?: string
  assinaturaCargo?: string
  assinaturaY?: number
}

export default function CertificadoCard({
  titulo, nomeAluno, templateUrl, whatsapp, numRegistro,
  nomeY, nomeFontePct, nomeCor, nomeEstilo,
  logoEsquerdaUrl, logoDireitaUrl, logoY, logoTamPct,
  assinaturaUrl, assinaturaNome, assinaturaCargo, assinaturaY,
}: Props) {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      <div style={{
        background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12,
        padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(129,140,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 20 }}>🎓</span>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--avp-text)', margin: '0 0 2px' }}>Certificado de Conclusão</p>
            <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0 }}>{titulo}</p>
          </div>
        </div>
        <button onClick={() => setAberto(true)} style={{
          background: '#818cf8', color: '#fff', border: 'none', borderRadius: 8,
          padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0
        }}>Ver certificado</button>
      </div>
      {aberto && (
        <CertificadoPopup
          nomeAluno={nomeAluno}
          templateUrl={templateUrl}
          nomeY={nomeY}
          nomeFontePct={nomeFontePct}
          nomeCor={nomeCor}
          nomeEstilo={nomeEstilo as any}
          logoEsquerdaUrl={logoEsquerdaUrl}
          logoDireitaUrl={logoDireitaUrl}
          logoY={logoY}
          logoTamPct={logoTamPct}
          assinaturaUrl={assinaturaUrl}
          assinaturaNome={assinaturaNome}
          assinaturaCargo={assinaturaCargo}
          assinaturaY={assinaturaY}
          onClose={() => setAberto(false)}
        />
      )}
    </>
  )
}
