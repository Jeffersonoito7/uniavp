'use client'

const NAVY_DEFAULT = '#0D2B6E'
const GREEN_DEFAULT = '#0A7A42'

type Props = {
  empresaNome?: string
  logoEsquerdaUrl?: string | null
  logoDireitaUrl?: string | null
  assinaturaNome?: string
  assinaturaCargo?: string
  assinaturaEmpresa?: string
  assinaturaUrl?: string | null
  urlVerificacao?: string
  tagline?: string
  corPrimaria?: string
  corSecundaria?: string
}

const DEMO_NOME = 'NOME DO CONSULTOR'
const DEMO_REG = '001234'
const DEMO_DATA = new Date().toLocaleDateString('pt-BR')
const DEMO_VALIDADE = new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toLocaleDateString('pt-BR')

function Field({ label, value, flex, labelColor = '#1A7A50' }: { label: string; value: string; flex?: boolean; labelColor?: string }) {
  return (
    <div style={{ flex: flex ? 1 : undefined, minWidth: 0 }}>
      <p style={{ fontSize: 7, fontWeight: 700, color: labelColor, margin: '0 0 1px', letterSpacing: 0.8, textTransform: 'uppercase' as const }}>{label}</p>
      <p style={{ fontSize: 11.5, fontWeight: 600, color: '#1a1a1a', margin: '0 0 4px', borderBottom: '1px solid #bbb', paddingBottom: 1, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{value || '—'}</p>
    </div>
  )
}

export default function CarteiraCardPreview({
  empresaNome = 'UNIVERSIDADE',
  logoEsquerdaUrl,
  logoDireitaUrl,
  assinaturaNome = 'Presidente',
  assinaturaCargo = 'PRESIDENTE',
  assinaturaEmpresa,
  assinaturaUrl,
  urlVerificacao = 'www.empresa.com.br',
  tagline = '',
  corPrimaria,
  corSecundaria,
}: Props) {
  const NAVY = corPrimaria || NAVY_DEFAULT
  const GREEN = corSecundaria || GREEN_DEFAULT
  const GREEN_LABEL = corSecundaria || '#1A7A50'
  const verificacaoUrl = (urlVerificacao || 'www.empresa.com.br').replace(/^https?:\/\//, '').replace(/\/$/, '')
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`https://${verificacaoUrl}/verificar/${DEMO_REG}`)}&color=0A7A42&bgcolor=ffffff`

  const Frente = () => (
    <div style={{ width: 620, height: 390, position: 'relative', overflow: 'hidden', fontFamily: '"Arial", "Helvetica", sans-serif', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>
      {/* Cabeçalho */}
      <div style={{ background: NAVY, height: 76, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 12, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none' }} width="620" height="76">
          {Array.from({ length: 8 }).map((_, i) => (
            <ellipse key={i} cx="310" cy="38" rx={30 + i * 38} ry={10 + i * 4} fill="none" stroke="#fff" strokeWidth="0.5" />
          ))}
        </svg>
        <div style={{ flexShrink: 0, height: 58, display: 'flex', alignItems: 'center' }}>
          {logoEsquerdaUrl ? (
            <img src={logoEsquerdaUrl} alt="Logo" style={{ height: 58, maxWidth: 70, objectFit: 'contain' }} />
          ) : (
            <div style={{ width: 52, height: 52, border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.08)', padding: 4 }}>
              <span style={{ fontSize: 6, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.4, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{(empresaNome || '').substring(0, 10).toUpperCase()}</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{(empresaNome || 'U').substring(0, 1).toUpperCase()}</span>
            </div>
          )}
        </div>
        <div style={{ flex: 1, textAlign: 'center' as const }}>
          <p style={{ color: '#fff', fontWeight: 900, fontSize: 16, margin: 0, letterSpacing: 2, textTransform: 'uppercase' as const }}>CARTEIRA <span style={{ fontWeight: 300 }}>de</span> FORMAÇÃO</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.25)' }} />
            <p style={{ color: GREEN, fontWeight: 700, fontSize: 9, margin: 0, letterSpacing: 2 }}>CONSULTOR CERTIFICADO</p>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.25)' }} />
          </div>
        </div>
        <div style={{ flexShrink: 0, height: 58, display: 'flex', alignItems: 'center' }}>
          {logoDireitaUrl ? (
            <img src={logoDireitaUrl} alt={empresaNome} style={{ height: 58, maxWidth: 100, objectFit: 'contain' }} />
          ) : (
            <div style={{ textAlign: 'right' as const }}>
              <p style={{ color: '#fff', fontWeight: 900, fontSize: 12, margin: 0 }}>{empresaNome}</p>
              {tagline && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 7, margin: '2px 0 0' }}>{tagline}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Corpo */}
      <div style={{ flex: 1, background: '#fff', display: 'flex', padding: '10px 14px', gap: 12, position: 'relative', overflow: 'hidden' }}>
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.045, pointerEvents: 'none' }} width="620" height="232" xmlns="http://www.w3.org/2000/svg">
          {Array.from({ length: 18 }).map((_, i) => (
            <ellipse key={`e${i}`} cx="310" cy="116" rx={20 + i * 16} ry={10 + i * 8} fill="none" stroke={NAVY} strokeWidth="0.5" />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <ellipse key={`r1${i}`} cx="100" cy="60" rx={8 + i * 7} ry={4 + i * 3.5} fill="none" stroke={NAVY} strokeWidth="0.4" transform={`rotate(${i * 15} 100 60)`} />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <ellipse key={`r2${i}`} cx="520" cy="60" rx={8 + i * 7} ry={4 + i * 3.5} fill="none" stroke={NAVY} strokeWidth="0.4" transform={`rotate(${i * 15} 520 60)`} />
          ))}
          {Array.from({ length: 24 }).map((_, i) => (
            <line key={`l${i}`} x1="0" y1={8 + i * 9} x2="620" y2={8 + i * 9} stroke={NAVY} strokeWidth="0.3" strokeDasharray="4 8" />
          ))}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: 0.025 }}>
          <div style={{ fontSize: 160, fontWeight: 900, color: NAVY, transform: 'rotate(-18deg)', letterSpacing: -8, whiteSpace: 'nowrap' as const }}>{empresaNome} {empresaNome}</div>
        </div>

        {/* Foto 3x4 placeholder */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          <div style={{ width: 144, height: 192, border: `2.5px solid ${GREEN}`, borderRadius: 4, overflow: 'hidden', background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <svg width="56" height="72" viewBox="0 0 56 72" fill="none">
                <circle cx="28" cy="24" r="14" fill="#ccc" />
                <ellipse cx="28" cy="60" rx="28" ry="17" fill="#ccc" />
              </svg>
              <span style={{ fontSize: 9, color: '#999', fontWeight: 600, textAlign: 'center' as const, lineHeight: 1.3 }}>FOTO 3×4</span>
            </div>
          </div>
        </div>

        {/* Campos */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 0, paddingTop: 4, minWidth: 0 }}>
          <Field label="Nome do Consultor" value={DEMO_NOME} labelColor={GREEN_LABEL} />
          <Field label="Nº de Registro" value={DEMO_REG} labelColor={GREEN_LABEL} />
          <div style={{ display: 'flex', gap: 10 }}>
            <Field label="Data de Formação" value={DEMO_DATA} flex labelColor={GREEN_LABEL} />
            <Field label="Validade" value={DEMO_VALIDADE} flex labelColor={GREEN_LABEL} />
          </div>
          <Field label="Curso de Formação" value={`Formação de Consultor ${empresaNome}`} labelColor={GREEN_LABEL} />
          <div style={{ display: 'flex', gap: 10 }}>
            <Field label="Carga Horária" value="40h" flex labelColor={GREEN_LABEL} />
            <Field label="Turma" value={String(new Date().getFullYear())} flex labelColor={GREEN_LABEL} />
          </div>
        </div>
      </div>

      {/* Assinatura + badge */}
      <div style={{ background: '#fff', borderTop: '1px solid #e0e0e0', padding: '4px 14px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          {assinaturaUrl ? (
            <img src={assinaturaUrl} alt={assinaturaNome} style={{ height: 52, maxWidth: 200, objectFit: 'contain', display: 'block', marginBottom: 2 }} />
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

      {/* Rodapé */}
      <div style={{ background: GREEN, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', flexShrink: 0 }}>
        <p style={{ color: '#fff', fontSize: 8, fontWeight: 700, margin: 0, letterSpacing: 0.8 }}>VÁLIDA EM TODO TERRITÓRIO NACIONAL</p>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 7.5, margin: 0, letterSpacing: 0.3 }}>VERIFIQUE EM: {verificacaoUrl}/verificar/{DEMO_REG}</p>
      </div>
    </div>
  )

  const Verso = () => (
    <div style={{ width: 620, height: 390, position: 'relative', overflow: 'hidden', fontFamily: '"Arial", "Helvetica", sans-serif', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>
      <div style={{ background: NAVY, height: 78, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <p style={{ color: '#fff', fontWeight: 900, fontSize: 20, margin: 0, letterSpacing: 2.5 }}>CONSULTOR CERTIFICADO</p>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, margin: '4px 0 0', letterSpacing: 2 }}>{empresaNome.toUpperCase()}</p>
      </div>

      <div style={{ flex: 1, background: '#fff', padding: '18px 24px', display: 'flex', gap: 20, position: 'relative', overflow: 'hidden' }}>
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none' }} width="620" height="250">
          {Array.from({ length: 14 }).map((_, i) => (
            <ellipse key={`ve${i}`} cx="310" cy="125" rx={35 + i * 22} ry={18 + i * 11} fill="none" stroke={NAVY} strokeWidth="0.5" />
          ))}
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`vl${i}`} x1="0" y1={6 + i * 12} x2="620" y2={6 + i * 12} stroke={NAVY} strokeWidth="0.25" strokeDasharray="3 6" />
          ))}
        </svg>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ border: `1.5px solid ${GREEN}`, borderRadius: 6, padding: '14px 18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: '#111', margin: '0 0 10px', textAlign: 'center' as const, lineHeight: 1.7, letterSpacing: 0.3 }}>
              ESTA CARTEIRA CERTIFICA QUE O PORTADOR<br />
              CONCLUIU COM APROVEITAMENTO O CURSO<br />
              DE FORMAÇÃO DA {empresaNome.toUpperCase()}.
            </p>
            <div style={{ width: '50%', height: 0.8, background: '#ccc', margin: '0 auto 10px' }} />
            <p style={{ fontSize: 9.5, color: '#333', margin: 0, textAlign: 'center' as const, lineHeight: 1.8, letterSpacing: 0.2 }}>
              O PORTADOR ESTÁ HABILITADO A ATUAR COMO<br />
              CONSULTOR AUTORIZADO, SEGUINDO TODOS<br />
              OS PADRÕES DE QUALIDADE, ÉTICA E<br />
              COMPROMISSO DA EMPRESA.
            </p>
          </div>
          <div>
            {assinaturaUrl ? (
              <img src={assinaturaUrl} alt={assinaturaNome} style={{ height: 68, maxWidth: 260, objectFit: 'contain', display: 'block', marginBottom: 2 }} />
            ) : (
              <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 24, color: '#222', margin: '0 0 2px' }}>{assinaturaNome}</p>
            )}
            <div style={{ width: 140, height: 0.8, background: '#444', marginBottom: 3 }} />
            <p style={{ fontSize: 8, color: '#555', margin: 0, fontWeight: 600, letterSpacing: 0.5 }}>{assinaturaCargo}</p>
            <p style={{ fontSize: 7.5, color: '#777', margin: 0, letterSpacing: 0.3 }}>{assinaturaEmpresa || empresaNome}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <img src={qrUrl} alt="QR Code" width={80} height={80} style={{ borderRadius: 4, border: '1px solid #ddd' }} />
          <p style={{ fontSize: 7, color: '#999', margin: 0, textAlign: 'center' as const }}>VERIFIQUE<br />AUTENTICIDADE</p>
        </div>
      </div>

      <div style={{ padding: '8px 24px', borderTop: '1px solid #eee', background: '#fafafa', display: 'flex', alignItems: 'center', gap: 12 }}>
        <svg width="36" height="36" viewBox="0 0 36 36">
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 - 90) * Math.PI / 180
            const x1 = 18 + 17 * Math.cos(angle)
            const y1 = 18 + 17 * Math.sin(angle)
            return <line key={i} x1="18" y1="18" x2={x1} y2={y1} stroke={GREEN} strokeWidth="1.2" opacity="0.7" />
          })}
          <circle cx="18" cy="18" r="16" fill="none" stroke={GREEN} strokeWidth="1" />
          <circle cx="18" cy="18" r="11" fill="none" stroke={GREEN} strokeWidth="0.6" />
          <circle cx="18" cy="18" r="6" fill={GREEN} opacity="0.15" />
          <text x="18" y="22" textAnchor="middle" fontSize="7" fontWeight="900" fill={GREEN}>✓</text>
        </svg>
        <div>
          <p style={{ fontSize: 8, fontWeight: 800, color: GREEN, margin: 0, letterSpacing: 1, textTransform: 'uppercase' as const }}>Documento Autêntico</p>
          <p style={{ fontSize: 7, color: '#888', margin: 0 }}>Nº {DEMO_REG} · Verificável em {verificacaoUrl}/verificar/{DEMO_REG}</p>
        </div>
      </div>

      <div style={{ background: '#fff', borderTop: '1px solid #eee', padding: '6px 24px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ background: NAVY, borderRadius: 4, padding: '5px 12px' }}>
          <p style={{ color: '#fff', fontWeight: 900, fontSize: 13, margin: 0 }}>Nº</p>
        </div>
        <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: 4, padding: '5px 14px', background: '#fafafa' }}>
          <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: NAVY, letterSpacing: 3 }}>{DEMO_REG}</p>
        </div>
      </div>

      <div style={{ background: GREEN, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', flexShrink: 0 }}>
        <div>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: 11, margin: 0, letterSpacing: 0.5 }}>{empresaNome}</p>
          {tagline && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 7, margin: 0 }}>{tagline}</p>}
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          <div style={{ width: 18, height: 32, background: 'rgba(255,255,255,0.3)', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
          <div style={{ width: 18, height: 32, background: 'rgba(255,255,255,0.3)', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
        </div>
      </div>
    </div>
  )

  const SCALE = 0.58

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8, textAlign: 'center' as const }}>FRENTE</p>
        <div style={{ width: 620 * SCALE, height: 390 * SCALE, overflow: 'hidden', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
          <div style={{ transform: `scale(${SCALE})`, transformOrigin: 'top left', width: 620, height: 390 }}>
            <Frente />
          </div>
        </div>
      </div>
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8, textAlign: 'center' as const }}>VERSO</p>
        <div style={{ width: 620 * SCALE, height: 390 * SCALE, overflow: 'hidden', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
          <div style={{ transform: `scale(${SCALE})`, transformOrigin: 'top left', width: 620, height: 390 }}>
            <Verso />
          </div>
        </div>
      </div>
    </div>
  )
}
