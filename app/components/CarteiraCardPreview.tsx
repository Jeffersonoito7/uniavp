'use client'

const NAVY_DEFAULT = '#0D2B6E'
const GREEN_DEFAULT = '#0A7A42'

// Formato retrato — espaço vertical generoso, nada cortado
const W = 420
const H = 560

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
      <p style={{ fontSize: 12.5, fontWeight: 600, color: '#1a1a1a', margin: '0 0 6px', borderBottom: '1px solid #e0e0e0', paddingBottom: 2, lineHeight: 1.2, wordBreak: 'break-word' as const }}>{value || '—'}</p>
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
  const urlBase = (urlVerificacao || 'www.empresa.com.br').replace(/^https?:\/\//, '').replace(/\/$/, '')
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(`https://${urlBase}/verificar/${DEMO_REG}`)}&color=0A7A42&bgcolor=ffffff`

  const HeaderNav = ({ height = 68 }: { height?: number }) => (
    <div style={{ background: NAVY, height, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 12, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
      <svg style={{ position: 'absolute', inset: 0, opacity: 0.07, pointerEvents: 'none' }} width={W} height={height}>
        {Array.from({ length: 7 }).map((_, i) => (
          <ellipse key={i} cx={W / 2} cy={height / 2} rx={28 + i * 36} ry={7 + i * 3} fill="none" stroke="#fff" strokeWidth="0.5" />
        ))}
      </svg>
      <div style={{ flexShrink: 0, height: 52, display: 'flex', alignItems: 'center', zIndex: 1 }}>
        {logoEsquerdaUrl ? (
          <img src={logoEsquerdaUrl} alt="Logo" style={{ height: 52, maxWidth: 60, objectFit: 'contain' }} />
        ) : (
          <div style={{ width: 44, height: 44, border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.08)', padding: 3 }}>
            <span style={{ fontSize: 5, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.3, fontWeight: 600, textAlign: 'center' as const, lineHeight: 1.2 }}>{(empresaNome || '').substring(0, 10).toUpperCase()}</span>
            <span style={{ fontSize: 19, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{(empresaNome || 'U').substring(0, 1).toUpperCase()}</span>
          </div>
        )}
      </div>
      <div style={{ flex: 1, textAlign: 'center' as const, zIndex: 1 }}>
        <p style={{ color: '#fff', fontWeight: 900, fontSize: 14, margin: 0, letterSpacing: 2, textTransform: 'uppercase' as const }}>
          CARTEIRA <span style={{ fontWeight: 300 }}>de</span> FORMAÇÃO
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 3 }}>
          <div style={{ flex: 1, height: 0.8, background: 'rgba(255,255,255,0.2)' }} />
          <p style={{ color: GREEN, fontWeight: 700, fontSize: 8, margin: 0, letterSpacing: 1.5 }}>CONSULTOR CERTIFICADO</p>
          <div style={{ flex: 1, height: 0.8, background: 'rgba(255,255,255,0.2)' }} />
        </div>
      </div>
      <div style={{ flexShrink: 0, height: 52, display: 'flex', alignItems: 'center', zIndex: 1 }}>
        {logoDireitaUrl ? (
          <img src={logoDireitaUrl} alt={empresaNome} style={{ height: 52, maxWidth: 90, objectFit: 'contain' }} />
        ) : (
          <div style={{ textAlign: 'right' as const }}>
            <p style={{ color: '#fff', fontWeight: 900, fontSize: 11, margin: 0 }}>{empresaNome}</p>
            {tagline && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 6.5, margin: '2px 0 0' }}>{tagline}</p>}
          </div>
        )}
      </div>
    </div>
  )

  const FooterVerde = ({ reg = DEMO_REG }: { reg?: string }) => (
    <div style={{ background: GREEN, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', flexShrink: 0 }}>
      <p style={{ color: '#fff', fontSize: 7.5, fontWeight: 700, margin: 0, letterSpacing: 0.5 }}>VÁLIDA EM TODO TERRITÓRIO NACIONAL</p>
      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 7, margin: 0 }}>VERIFIQUE EM: {urlBase}/verificar/{reg}</p>
    </div>
  )

  const Frente = () => (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', fontFamily: '"Arial", "Helvetica", sans-serif', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>
      <HeaderNav />

      {/* Corpo */}
      <div style={{ flex: 1, background: '#fff', display: 'flex', padding: '16px 18px', gap: 14, position: 'relative' }}>
        {/* Marca d'água */}
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none' }} width={W} height="400">
          {Array.from({ length: 16 }).map((_, i) => (
            <ellipse key={`e${i}`} cx={W / 2} cy={200} rx={18 + i * 14} ry={9 + i * 7} fill="none" stroke={NAVY} strokeWidth="0.5" />
          ))}
          {Array.from({ length: 22 }).map((_, i) => (
            <line key={`l${i}`} x1="0" y1={8 + i * 18} x2={W} y2={8 + i * 18} stroke={NAVY} strokeWidth="0.25" strokeDasharray="4 8" />
          ))}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: 0.02 }}>
          <div style={{ fontSize: 100, fontWeight: 900, color: NAVY, transform: 'rotate(-20deg)', whiteSpace: 'nowrap' as const, letterSpacing: -4 }}>
            {empresaNome} {empresaNome}
          </div>
        </div>

        {/* Foto 3×4 */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ width: 110, height: 146, border: `2.5px solid ${GREEN}`, borderRadius: 5, overflow: 'hidden', background: '#ebebeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <svg width="46" height="58" viewBox="0 0 56 72" fill="none">
                <circle cx="28" cy="24" r="14" fill="#ccc" />
                <ellipse cx="28" cy="60" rx="28" ry="17" fill="#ccc" />
              </svg>
              <span style={{ fontSize: 8, color: '#999', fontWeight: 600, textAlign: 'center' as const }}>FOTO 3×4</span>
            </div>
          </div>
        </div>

        {/* Campos */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', minWidth: 0, paddingTop: 2 }}>
          <Field label="Nome do Consultor" value={DEMO_NOME} labelColor={GREEN_LABEL} />
          <Field label="Nº de Registro" value={DEMO_REG} labelColor={GREEN_LABEL} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Field label="Data de Formação" value={DEMO_DATA} flex labelColor={GREEN_LABEL} />
            <Field label="Validade" value={DEMO_VALIDADE} flex labelColor={GREEN_LABEL} />
          </div>
          <Field label="Curso de Formação" value={`Formação de Consultor ${empresaNome}`} labelColor={GREEN_LABEL} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Field label="Carga Horária" value="40h" flex labelColor={GREEN_LABEL} />
            <Field label="Turma" value={String(new Date().getFullYear())} flex labelColor={GREEN_LABEL} />
          </div>
        </div>
      </div>

      {/* Assinatura + Badge */}
      <div style={{ background: '#fafafa', borderTop: '1px solid #ebebeb', padding: '7px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, height: 52 }}>
        <div>
          {assinaturaUrl ? (
            <img src={assinaturaUrl} alt={assinaturaNome} style={{ height: 26, maxWidth: 160, objectFit: 'contain', display: 'block', marginBottom: 1 }} />
          ) : (
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 17, color: '#222', margin: 0, lineHeight: 1 }}>{assinaturaNome}</p>
          )}
          <div style={{ width: 88, height: 0.8, background: '#555', margin: '2px 0 1px' }} />
          <p style={{ fontSize: 7, color: '#555', margin: 0, letterSpacing: 0.5, fontWeight: 600 }}>{assinaturaCargo}</p>
        </div>
        <div style={{ background: GREEN, borderRadius: 5, padding: '5px 12px', textAlign: 'center' as const }}>
          <p style={{ color: '#fff', fontWeight: 900, fontSize: 8.5, margin: 0, letterSpacing: 1 }}>CONSULTOR CERTIFICADO</p>
          <div style={{ width: '100%', height: 0.8, background: 'rgba(255,255,255,0.35)', margin: '2px 0' }} />
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 6.5, margin: 0, letterSpacing: 0.5 }}>— COMPROMISSO • ÉTICA • EXCELÊNCIA —</p>
        </div>
      </div>

      <FooterVerde />
    </div>
  )

  const Verso = () => (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', fontFamily: '"Arial", "Helvetica", sans-serif', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>

      {/* Cabeçalho */}
      <div style={{ background: NAVY, height: 68, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.07, pointerEvents: 'none' }} width={W} height="68">
          {Array.from({ length: 7 }).map((_, i) => (
            <ellipse key={i} cx={W / 2} cy="34" rx={28 + i * 36} ry={7 + i * 3} fill="none" stroke="#fff" strokeWidth="0.5" />
          ))}
        </svg>
        <p style={{ color: '#fff', fontWeight: 900, fontSize: 18, margin: 0, letterSpacing: 2.5 }}>CONSULTOR CERTIFICADO</p>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, margin: '4px 0 0', letterSpacing: 2 }}>{empresaNome.toUpperCase()}</p>
      </div>

      {/* Corpo — layout coluna, espaço amplo, sem flex:1 no texto */}
      <div style={{ flex: 1, background: '#fff', padding: '22px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
        {/* Marca d'água */}
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none' }} width={W} height="452">
          {Array.from({ length: 14 }).map((_, i) => (
            <ellipse key={`ve${i}`} cx={W / 2} cy={226} rx={30 + i * 20} ry={15 + i * 10} fill="none" stroke={NAVY} strokeWidth="0.5" />
          ))}
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`vl${i}`} x1="0" y1={5 + i * 22} x2={W} y2={5 + i * 22} stroke={NAVY} strokeWidth="0.22" strokeDasharray="3 7" />
          ))}
        </svg>

        {/* Caixa de texto de certificação — altura automática, nunca corta */}
        <div style={{ border: `1.5px solid ${GREEN}`, borderRadius: 8, padding: '16px 20px' }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, color: '#111', margin: '0 0 8px', textAlign: 'center' as const, lineHeight: 1.55, letterSpacing: 0.3 }}>
            ESTA CARTEIRA CERTIFICA QUE O PORTADOR<br />
            CONCLUIU COM APROVEITAMENTO O CURSO<br />
            DE FORMAÇÃO DA {empresaNome.toUpperCase()}.
          </p>
          <div style={{ width: '45%', height: 0.8, background: '#ccc', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 10.5, color: '#333', margin: 0, textAlign: 'center' as const, lineHeight: 1.55, letterSpacing: 0.2 }}>
            O PORTADOR ESTÁ HABILITADO A ATUAR COMO<br />
            CONSULTOR AUTORIZADO, SEGUINDO TODOS<br />
            OS PADRÕES DE QUALIDADE, ÉTICA E<br />
            COMPROMISSO DA EMPRESA.
          </p>
        </div>

        {/* Assinatura + QR — mesma linha */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {assinaturaUrl ? (
              <img src={assinaturaUrl} alt={assinaturaNome} style={{ height: 46, maxWidth: 220, objectFit: 'contain', display: 'block', marginBottom: 2 }} />
            ) : (
              <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 19, color: '#222', margin: '0 0 2px' }}>{assinaturaNome}</p>
            )}
            <div style={{ width: 130, height: 0.8, background: '#444', marginBottom: 3 }} />
            <p style={{ fontSize: 8, color: '#555', margin: 0, fontWeight: 600, letterSpacing: 0.5 }}>{assinaturaCargo}</p>
            <p style={{ fontSize: 7.5, color: '#777', margin: 0, letterSpacing: 0.3 }}>{assinaturaEmpresa || empresaNome}</p>
          </div>
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <img src={qrUrl} alt="QR Code" width={88} height={88} style={{ borderRadius: 6, border: '1px solid #ddd', display: 'block' }} />
            <p style={{ fontSize: 7, color: '#999', margin: 0, textAlign: 'center' as const, lineHeight: 1.4 }}>VERIFIQUE<br />AUTENTICIDADE</p>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div style={{ background: GREEN, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', flexShrink: 0 }}>
        <div>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: 10, margin: 0, letterSpacing: 0.3 }}>{empresaNome}</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 7, margin: '1px 0 0' }}>Nº {DEMO_REG} · Verifique em: {urlBase}</p>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 7, margin: 0, fontWeight: 700, letterSpacing: 1 }}>DOCUMENTO AUTÊNTICO</p>
      </div>
    </div>
  )

  const SCALE = 0.60

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8, textAlign: 'center' as const }}>FRENTE</p>
        <div style={{ width: W * SCALE, height: H * SCALE, overflow: 'hidden', borderRadius: 10, boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
          <div style={{ transform: `scale(${SCALE})`, transformOrigin: 'top left', width: W, height: H }}>
            <Frente />
          </div>
        </div>
      </div>
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8, textAlign: 'center' as const }}>VERSO</p>
        <div style={{ width: W * SCALE, height: H * SCALE, overflow: 'hidden', borderRadius: 10, boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
          <div style={{ transform: `scale(${SCALE})`, transformOrigin: 'top left', width: W, height: H }}>
            <Verso />
          </div>
        </div>
      </div>
    </div>
  )
}
