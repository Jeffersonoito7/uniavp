import Link from 'next/link'
import CertificadoCard from './CertificadoCard'

type ModuloComAulas = {
  modulo_id: string
  modulo_titulo: string
  modulo_ordem: number
  aulas: { status: string }[]
  apenasProPermissao: boolean
}

type CertConfig = {
  cert_template_url?: string
  cert_nome_y?: number
  cert_nome_tamanho?: number
  cert_nome_cor?: string
  cert_nome_estilo?: string
  cert_logo_esq_url?: string | null
  cert_logo_dir_url?: string | null
  cert_logo_y?: number
  cert_logo_tam?: number
  cert_assinatura_url?: string | null
  cert_assinatura_nome?: string
  cert_assinatura_cargo?: string
  cert_assinatura_y?: number
}

type Props = {
  modulos: ModuloComAulas[]
  moduloCerts: Record<string, CertConfig>
  mostrarCarteira: boolean
  whatsapp: string
  nomeAluno: string
  numRegistro?: number | null
  carteiraLogoEsq?: string
  carteiraLogoDir?: string
  carteiraAssinaturaUrl?: string
  carteiraAssinaturaNome?: string
  carteiraAssinaturaCargo?: string
}

export default function MeusCertificados({
  modulos, moduloCerts, mostrarCarteira,
  whatsapp, nomeAluno, numRegistro,
}: Props) {
  const modulosConcluidos = modulos.filter(m =>
    !m.apenasProPermissao &&
    m.aulas.length > 0 &&
    m.aulas.every(a => a.status === 'concluida') &&
    moduloCerts[m.modulo_id]?.cert_template_url
  )

  if (modulosConcluidos.length === 0 && !mostrarCarteira) return null

  return (
    <div style={{ marginBottom: 28 }}>
      <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: 'var(--avp-text)' }}>Meus Certificados</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {modulosConcluidos.map(m => {
          const cfg = moduloCerts[m.modulo_id]
          return (
            <CertificadoCard
              key={m.modulo_id}
              titulo={m.modulo_titulo}
              nomeAluno={nomeAluno}
              templateUrl={cfg.cert_template_url!}
              whatsapp={whatsapp}
              numRegistro={numRegistro ? String(numRegistro) : undefined}
              nomeY={cfg.cert_nome_y}
              nomeFontePct={cfg.cert_nome_tamanho}
              nomeCor={cfg.cert_nome_cor}
              nomeEstilo={cfg.cert_nome_estilo}
              logoEsquerdaUrl={cfg.cert_logo_esq_url}
              logoDireitaUrl={cfg.cert_logo_dir_url}
              logoY={cfg.cert_logo_y}
              logoTamPct={cfg.cert_logo_tam}
              assinaturaUrl={cfg.cert_assinatura_url}
              assinaturaNome={cfg.cert_assinatura_nome}
              assinaturaCargo={cfg.cert_assinatura_cargo}
              assinaturaY={cfg.cert_assinatura_y}
            />
          )
        })}

        {mostrarCarteira && (
          <div style={{
            background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12,
            padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(251,191,36,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 20 }}>🪪</span>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--avp-text)', margin: '0 0 2px' }}>Carteirinha de Consultor</p>
                <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0 }}>Seu documento de identificação como consultor</p>
              </div>
            </div>
            <Link href={`/aluno/${whatsapp}/carteira`} style={{
              background: '#fbbf24', color: '#1a1a1a', border: 'none', borderRadius: 8,
              padding: '8px 16px', fontWeight: 700, fontSize: 13, textDecoration: 'none', flexShrink: 0, display: 'inline-block'
            }}>Ver carteirinha</Link>
          </div>
        )}
      </div>
    </div>
  )
}
