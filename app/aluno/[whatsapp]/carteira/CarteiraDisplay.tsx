'use client'
import { useState, useRef, useCallback } from 'react'

const NAVY = '#0D2B6E'
const GREEN = '#0A7A42'
const GREEN_LABEL = '#1A7A50'

type Props = {
  nome: string
  numRegistro: string
  fotoUrl: string | null
  dataFormacao: string
  validade: string
  cargaHoraria: string
  turma: string
  whatsapp: string
  status: string
  empresaNome?: string
  empresaLogoUrl?: string | null
  logoEsquerdaUrl?: string | null
  logoDireitaUrl?: string | null
  assinaturaNome?: string
  assinaturaCargo?: string
  assinaturaEmpresa?: string
  assinaturaUrl?: string | null
  urlVerificacao?: string
  tagline?: string
}

function Field({ label, value, flex }: { label: string; value: string; flex?: boolean }) {
  return (
    <div style={{ flex: flex ? 1 : undefined, minWidth: 0 }}>
      <p style={{ fontSize: 7.5, fontWeight: 700, color: GREEN_LABEL, margin: '0 0 1px', letterSpacing: 0.8, textTransform: 'uppercase' as const }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', margin: '0 0 6px', borderBottom: '1px solid #bbb', paddingBottom: 2, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{value || '—'}</p>
    </div>
  )
}

export default function CarteiraDisplay({ nome, numRegistro, fotoUrl: fotoInicial, dataFormacao, validade, cargaHoraria, turma, whatsapp, status, empresaNome = 'UNIVERSIDADE', empresaLogoUrl, logoEsquerdaUrl, logoDireitaUrl, assinaturaNome = 'Jose Tiburcio dos Santos', assinaturaCargo = 'PRESIDENTE', assinaturaEmpresa, assinaturaUrl, urlVerificacao = '', tagline = '' }: Props) {
  const [fotoUrl, setFotoUrl] = useState<string | null>(fotoInicial)
  const [uploadando, setUploadando] = useState(false)
  const [msgFoto, setMsgFoto] = useState('')
  const fotoRef = useRef<HTMLInputElement>(null)

  const baseVerificacao = urlVerificacao || (typeof window !== 'undefined' ? window.location.origin : '')
  const verificacaoUrl = baseVerificacao.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const verificacaoLink = `${baseVerificacao.startsWith('http') ? baseVerificacao : 'https://' + baseVerificacao}/verificar/${numRegistro}`
  const qrVerificacao = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verificacaoLink)}&color=0A7A42&bgcolor=ffffff`

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoUrl(URL.createObjectURL(file))
    setUploadando(true)
    const fd = new FormData()
    fd.append('foto', file)
    const res = await fetch('/api/aluno/foto-carteira', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) { setFotoUrl(data.url); setMsgFoto('Foto salva!') }
    else setMsgFoto('Erro ao salvar foto.')
    setUploadando(false)
    setTimeout(() => setMsgFoto(''), 3000)
  }

  const qrUrl = qrVerificacao

  // Frente e verso do cartão
  const CardFrente = () => (
    <div style={{ width: 620, height: 390, position: 'relative', overflow: 'hidden', fontFamily: '"Arial", "Helvetica", sans-serif', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>

      {/* Cabeçalho */}
      <div style={{ background: NAVY, height: 82, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 12, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        {/* Guilloché sutil no cabeçalho */}
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none' }} width="620" height="82">
          {Array.from({ length: 8 }).map((_, i) => (
            <ellipse key={i} cx="310" cy="41" rx={30 + i * 38} ry={12 + i * 5} fill="none" stroke="#fff" strokeWidth="0.5" />
          ))}
        </svg>

        {/* Logo esquerda (UNIAVP) */}
        <div style={{ flexShrink: 0, height: 58, display: 'flex', alignItems: 'center' }}>
          {logoEsquerdaUrl ? (
            <img src={logoEsquerdaUrl} alt="Logo" style={{ height: 58, maxWidth: 70, objectFit: 'contain' }} />
          ) : (
            <div style={{ width: 52, height: 52, border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5, fontWeight: 600 }}>UNIVERSIDADE</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, margin: '2px 0' }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#fff', lineHeight: 1 }}>A</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#fff', lineHeight: 1 }}>V</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: GREEN, lineHeight: 1 }}>P</span>
                <div style={{ width: 12, height: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Título central */}
        <div style={{ flex: 1, textAlign: 'center' as const }}>
          <p style={{ color: '#fff', fontWeight: 900, fontSize: 16, margin: 0, letterSpacing: 2, textTransform: 'uppercase' as const }}>CARTEIRA <span style={{ fontWeight: 300 }}>de</span> FORMAÇÃO</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.25)' }} />
            <p style={{ color: GREEN, fontWeight: 700, fontSize: 9, margin: 0, letterSpacing: 2 }}>CONSULTOR CERTIFICADO</p>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.25)' }} />
          </div>
        </div>

        {/* Logo direita (AUTOVALE) */}
        <div style={{ flexShrink: 0, height: 58, display: 'flex', alignItems: 'center' }}>
          {logoDireitaUrl ? (
            <img src={logoDireitaUrl} alt={empresaNome} style={{ height: 58, maxWidth: 100, objectFit: 'contain' }} />
          ) : empresaLogoUrl ? (
            <img src={empresaLogoUrl} alt={empresaNome} style={{ height: 48, maxWidth: 100, objectFit: 'contain' }} />
          ) : (
            <div style={{ textAlign: 'right' as const }}>
              <p style={{ color: '#fff', fontWeight: 900, fontSize: 12, margin: 0 }}>{empresaNome}</p>
              {tagline && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 7, margin: '2px 0 0' }}>{tagline}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Corpo */}
      <div style={{ flex: 1, background: '#fff', display: 'flex', padding: '14px 18px', gap: 16, position: 'relative', overflow: 'hidden' }}>
        {/* ── MARCA D'ÁGUA ESTILO CÉDULA ── */}
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.045, pointerEvents: 'none' }} width="620" height="232" xmlns="http://www.w3.org/2000/svg">
          {/* Guilloché centro — elipses concêntricas */}
          {Array.from({ length: 18 }).map((_, i) => (
            <ellipse key={`e${i}`} cx="310" cy="116" rx={20 + i * 16} ry={10 + i * 8} fill="none" stroke={NAVY} strokeWidth="0.5" />
          ))}
          {/* Roseta superior esquerda */}
          {Array.from({ length: 12 }).map((_, i) => (
            <ellipse key={`r1${i}`} cx="100" cy="60" rx={8 + i * 7} ry={4 + i * 3.5} fill="none" stroke={NAVY} strokeWidth="0.4"
              transform={`rotate(${i * 15} 100 60)`} />
          ))}
          {/* Roseta superior direita */}
          {Array.from({ length: 12 }).map((_, i) => (
            <ellipse key={`r2${i}`} cx="520" cy="60" rx={8 + i * 7} ry={4 + i * 3.5} fill="none" stroke={NAVY} strokeWidth="0.4"
              transform={`rotate(${i * 15} 520 60)`} />
          ))}
          {/* Roseta inferior */}
          {Array.from({ length: 12 }).map((_, i) => (
            <ellipse key={`r3${i}`} cx="310" cy="210" rx={8 + i * 6} ry={4 + i * 3} fill="none" stroke={GREEN} strokeWidth="0.4"
              transform={`rotate(${i * 15} 310 210)`} />
          ))}
          {/* Linhas finas horizontais */}
          {Array.from({ length: 24 }).map((_, i) => (
            <line key={`l${i}`} x1="0" y1={8 + i * 9} x2="620" y2={8 + i * 9} stroke={NAVY} strokeWidth="0.3" strokeDasharray="4 8" />
          ))}
        </svg>

        {/* Texto AVP diagonal tênue */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: 0.025 }}>
          <div style={{ fontSize: 160, fontWeight: 900, color: NAVY, transform: 'rotate(-18deg)', letterSpacing: -8, whiteSpace: 'nowrap' as const }}>AVP AVP</div>
        </div>

        {/* Foto 3x4 */}
        <div style={{ flexShrink: 0 }}>
          <div
            onClick={() => fotoRef.current?.click()}
            style={{ width: 108, height: 150, border: `2.5px solid ${GREEN}`, borderRadius: 4, overflow: 'hidden', background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
            title="Clique para trocar foto"
          >
            {fotoUrl ? (
              <img src={fotoUrl} alt={nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg width="56" height="80" viewBox="0 0 56 80" fill="none">
                <ellipse cx="28" cy="22" rx="15" ry="15" fill="#b0b0b0" />
                <ellipse cx="28" cy="65" rx="28" ry="20" fill="#b0b0b0" />
              </svg>
            )}
            {uploadando && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 10 }}>...</span>
              </div>
            )}
          </div>
          <input ref={fotoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFoto} />
        </div>

        {/* Campos */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 0, paddingTop: 4, minWidth: 0 }}>
          <Field label="Nome do Consultor" value={nome} />
          <Field label="Nº de Registro" value={numRegistro} />
          <div style={{ display: 'flex', gap: 10 }}>
            <Field label="Data de Formação" value={dataFormacao} flex />
            <Field label="Validade" value={validade} flex />
          </div>
          <Field label="Curso de Formação" value="Formação de Consultor AVP" />
          <div style={{ display: 'flex', gap: 10 }}>
            <Field label="Carga Horária" value={cargaHoraria} flex />
            <Field label="Turma" value={turma} flex />
          </div>
        </div>
      </div>

      {/* Assinatura + badge */}
      <div style={{ background: '#fff', borderTop: '1px solid #e0e0e0', padding: '6px 18px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          {assinaturaUrl ? (
            <img src={assinaturaUrl} alt={assinaturaNome} style={{ height: 32, maxWidth: 130, objectFit: 'contain', display: 'block', marginBottom: 2 }} />
          ) : (
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 20, color: '#222', margin: 0, lineHeight: 1 }}>{assinaturaNome}</p>
          )}
          <div style={{ width: 100, height: 0.8, background: '#555', margin: '3px 0 1px' }} />
          <p style={{ fontSize: 7.5, color: '#555', margin: 0, letterSpacing: 0.5, fontWeight: 600 }}>{assinaturaCargo}</p>
          <p style={{ fontSize: 7, color: '#777', margin: 0, letterSpacing: 0.3 }}>{assinaturaEmpresa || empresaNome}</p>
        </div>
        <div style={{ background: GREEN, borderRadius: 5, padding: '5px 14px', textAlign: 'center' as const }}>
          <p style={{ color: '#fff', fontWeight: 900, fontSize: 9.5, margin: 0, letterSpacing: 1.2 }}>CONSULTOR CERTIFICADO</p>
          <div style={{ width: '100%', height: 0.8, background: 'rgba(255,255,255,0.4)', margin: '2px 0' }} />
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 7.5, margin: 0, letterSpacing: 0.8 }}>— COMPROMISSO • ÉTICA • EXCELÊNCIA —</p>
        </div>
      </div>

      {/* Rodapé verde */}
      <div style={{ background: GREEN, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', flexShrink: 0 }}>
        <p style={{ color: '#fff', fontSize: 8, fontWeight: 700, margin: 0, letterSpacing: 0.8 }}>VÁLIDA EM TODO TERRITÓRIO NACIONAL</p>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 7.5, margin: 0, letterSpacing: 0.3 }}>VERIFIQUE EM: {verificacaoUrl}/verificar/{numRegistro}</p>
      </div>
    </div>
  )

  const CardVerso = () => (
    <div style={{ width: 620, height: 390, position: 'relative', overflow: 'hidden', fontFamily: '"Arial", "Helvetica", sans-serif', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>

      {/* Cabeçalho */}
      <div style={{ background: NAVY, height: 78, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <p style={{ color: '#fff', fontWeight: 900, fontSize: 20, margin: 0, letterSpacing: 2.5 }}>CONSULTOR CERTIFICADO</p>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, margin: '4px 0 0', letterSpacing: 2 }}>AUTOVALE PREVENÇÕES</p>
      </div>

      {/* Corpo */}
      <div style={{ flex: 1, background: '#fff', padding: '18px 24px', display: 'flex', gap: 20, position: 'relative', overflow: 'hidden' }}>
        {/* Guilloché verso */}
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none' }} width="620" height="250">
          {Array.from({ length: 14 }).map((_, i) => (
            <ellipse key={`ve${i}`} cx="310" cy="125" rx={35 + i * 22} ry={18 + i * 11} fill="none" stroke={NAVY} strokeWidth="0.5" />
          ))}
          {Array.from({ length: 14 }).map((_, i) => (
            <ellipse key={`vr${i}`} cx="120" cy="125" rx={10 + i * 8} ry={5 + i * 4} fill="none" stroke={GREEN} strokeWidth="0.4"
              transform={`rotate(${i * 13} 120 125)`} />
          ))}
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`vl${i}`} x1="0" y1={6 + i * 12} x2="620" y2={6 + i * 12} stroke={NAVY} strokeWidth="0.25" strokeDasharray="3 6" />
          ))}
        </svg>

        {/* Coluna principal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Texto de certificação */}
          <div style={{ border: `1.5px solid ${GREEN}`, borderRadius: 6, padding: '14px 18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: '#111', margin: '0 0 10px', textAlign: 'center' as const, lineHeight: 1.7, letterSpacing: 0.3 }}>
              ESTA CARTEIRA CERTIFICA QUE O PORTADOR<br/>
              CONCLUIU COM APROVEITAMENTO O CURSO<br/>
              DE FORMAÇÃO DA AUTOVALE PREVENÇÕES.
            </p>
            <div style={{ width: '50%', height: 0.8, background: '#ccc', margin: '0 auto 10px' }} />
            <p style={{ fontSize: 9.5, color: '#333', margin: 0, textAlign: 'center' as const, lineHeight: 1.8, letterSpacing: 0.2 }}>
              O PORTADOR ESTÁ HABILITADO A ATUAR COMO<br/>
              CONSULTOR AUTORIZADO, SEGUINDO TODOS<br/>
              OS PADRÕES DE QUALIDADE, ÉTICA E<br/>
              COMPROMISSO DA EMPRESA.
            </p>
          </div>

          {/* Assinatura */}
          <div>
            {assinaturaUrl ? (
              <img src={assinaturaUrl} alt={assinaturaNome} style={{ height: 44, maxWidth: 180, objectFit: 'contain', display: 'block', marginBottom: 2 }} />
            ) : (
              <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 24, color: '#222', margin: '0 0 2px' }}>{assinaturaNome}</p>
            )}
            <div style={{ width: 140, height: 0.8, background: '#444', marginBottom: 3 }} />
            <p style={{ fontSize: 8, color: '#555', margin: 0, fontWeight: 600, letterSpacing: 0.5 }}>{assinaturaCargo}</p>
            <p style={{ fontSize: 7.5, color: '#777', margin: 0, letterSpacing: 0.3 }}>{assinaturaEmpresa || empresaNome}</p>
          </div>
        </div>

        {/* QR Code */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <img src={qrUrl} alt="QR Code" width={80} height={80} style={{ borderRadius: 4, border: '1px solid #ddd' }} />
          <p style={{ fontSize: 7, color: '#999', margin: 0, textAlign: 'center' as const }}>VERIFIQUE<br/>AUTENTICIDADE</p>
        </div>
      </div>

      {/* Selo de autenticidade */}
      <div style={{ padding: '8px 24px', borderTop: '1px solid #eee', background: '#fafafa', display: 'flex', alignItems: 'center', gap: 12 }}>
        <svg width="36" height="36" viewBox="0 0 36 36">
          {/* Estrela de 12 pontas */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 - 90) * Math.PI / 180
            const x1 = 18 + 17 * Math.cos(angle)
            const y1 = 18 + 17 * Math.sin(angle)
            const angle2 = ((i + 0.5) * 30 - 90) * Math.PI / 180
            const x2 = 18 + 10 * Math.cos(angle2)
            const y2 = 18 + 10 * Math.sin(angle2)
            return <line key={i} x1="18" y1="18" x2={x1} y2={y1} stroke={GREEN} strokeWidth="1.2" opacity="0.7" />
          })}
          <circle cx="18" cy="18" r="16" fill="none" stroke={GREEN} strokeWidth="1" />
          <circle cx="18" cy="18" r="11" fill="none" stroke={GREEN} strokeWidth="0.6" />
          <circle cx="18" cy="18" r="6" fill={GREEN} opacity="0.15" />
          <text x="18" y="22" textAnchor="middle" fontSize="7" fontWeight="900" fill={GREEN}>✓</text>
        </svg>
        <div>
          <p style={{ fontSize: 8, fontWeight: 800, color: GREEN, margin: 0, letterSpacing: 1, textTransform: 'uppercase' as const }}>Documento Autêntico</p>
          <p style={{ fontSize: 7, color: '#888', margin: 0 }}>Nº {numRegistro} · Verificável em {verificacaoUrl}/verificar/{numRegistro}</p>
        </div>
      </div>

      {/* Campo Nº */}
      <div style={{ background: '#fff', borderTop: '1px solid #eee', padding: '6px 24px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ background: NAVY, borderRadius: 4, padding: '5px 12px' }}>
          <p style={{ color: '#fff', fontWeight: 900, fontSize: 13, margin: 0 }}>Nº</p>
        </div>
        <div style={{ flex: 1, border: `1px solid #ccc`, borderRadius: 4, padding: '5px 14px', background: '#fafafa' }}>
          <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: NAVY, letterSpacing: 3 }}>{numRegistro}</p>
        </div>
      </div>

      {/* Rodapé verde */}
      <div style={{ background: GREEN, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {empresaLogoUrl ? (
            <img src={empresaLogoUrl} alt={empresaNome} style={{ height: 34, maxWidth: 100, objectFit: 'contain' }} />
          ) : (
            <div>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: 11, margin: 0, letterSpacing: 0.5 }}>{empresaNome}</p>
              {tagline && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 7, margin: 0 }}>{tagline}</p>}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          <div style={{ width: 18, height: 32, background: 'rgba(255,255,255,0.3)', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
          <div style={{ width: 18, height: 32, background: 'rgba(255,255,255,0.3)', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @media print {
          body { background: #fff !important; margin: 0 !important; }
          .no-print { display: none !important; }
          .print-area { padding: 10mm !important; }
          .card-wrapper { page-break-inside: avoid; margin-bottom: 10mm; }
        }
      `}</style>

      {/* Header */}
      <header className="no-print" style={{ background: 'rgba(8,9,13,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--avp-border)', padding: '0 24px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href={`/aluno/${whatsapp}`} style={{ color: 'var(--avp-text-dim)', textDecoration: 'none', fontSize: 14 }}>← Meu Painel</a>
        <h1 style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>🎓 Carteira de Formação</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          {msgFoto && <span style={{ color: 'var(--avp-green)', fontSize: 13, alignSelf: 'center' }}>{msgFoto}</span>}
          <a
            href={verificacaoLink}
            target="_blank"
            rel="noreferrer"
            style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13, textDecoration: 'none' }}
          >
            🔍 Verificar autenticidade
          </a>
          <button
            onClick={() => window.print()}
            style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
          >
            🖨 Imprimir / PDF
          </button>
        </div>
      </header>

      {/* Instruções */}
      <div className="no-print" style={{ maxWidth: 700, margin: '24px auto 0', padding: '0 24px' }}>
        {status !== 'concluido' && (
          <div style={{ background: '#f59e0b15', border: '1px solid #f59e0b50', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <p style={{ fontWeight: 700, color: '#f59e0b', margin: '0 0 4px' }}>Curso em andamento</p>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, margin: 0 }}>Sua carteira ficará completa quando você concluir todos os módulos. Você já pode visualizá-la e adicionar sua foto.</p>
            </div>
          </div>
        )}
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '12px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 20 }}>📸</span>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, margin: 0 }}>
            <strong style={{ color: 'var(--avp-text)' }}>Foto 3x4:</strong> Clique na área da foto na carteira abaixo para adicionar ou trocar sua foto. Use uma foto recente com fundo claro.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="print-area" style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px 60px', display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'center' }}>
        <div className="card-wrapper">
          <p className="no-print" style={{ color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 10, textAlign: 'center' as const }}>FRENTE</p>
          <CardFrente />
        </div>
        <div className="card-wrapper">
          <p className="no-print" style={{ color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 10, textAlign: 'center' as const }}>VERSO</p>
          <CardVerso />
        </div>
      </div>
    </div>
  )
}
