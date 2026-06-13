'use client'

const NAVY_DEFAULT = '#0D2B6E'
const GREEN_DEFAULT = '#0A7A42'

// Formato horizontal padrão (estilo CNH / cartão profissional)
const W = 620
const H = 390

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
 <p style={{ fontSize: 11.5, fontWeight: 600, color: '#1a1a1a', margin: '0 0 5px', borderBottom: '1px solid #ddd', paddingBottom: 1, lineHeight: 1.2, wordBreak: 'break-word' as const }}>{value || '—'}</p>
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

 // Frente: foto grande + campos
 const Frente = () => (
 <div style={{ width: W, height: H, overflow: 'hidden', fontFamily: '"Arial","Helvetica",sans-serif', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>

 {/* Cabeçalho */}
 <div style={{ background: NAVY, height: 70, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 12, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
 <svg style={{ position: 'absolute', inset: 0, opacity: 0.07, pointerEvents: 'none' }} width={W} height="70">
 {Array.from({ length: 8 }).map((_, i) => (
 <ellipse key={i} cx={W / 2} cy="35" rx={30 + i * 38} ry={9 + i * 4} fill="none" stroke="#fff" strokeWidth="0.5" />
 ))}
 </svg>
 <div style={{ flexShrink: 0, height: 54, display: 'flex', alignItems: 'center', zIndex: 1 }}>
 {logoEsquerdaUrl ? (
 <img src={logoEsquerdaUrl} alt="Logo" style={{ height: 54, maxWidth: 70, objectFit: 'contain' }} />
 ) : (
 <div style={{ width: 48, height: 48, border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.08)', padding: 4 }}>
 <span style={{ fontSize: 5.5, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.4, fontWeight: 600, textAlign: 'center' as const, lineHeight: 1.2 }}>{(empresaNome || '').substring(0, 10).toUpperCase()}</span>
 <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{(empresaNome || 'U').substring(0, 1).toUpperCase()}</span>
 </div>
 )}
 </div>
 <div style={{ flex: 1, textAlign: 'center' as const, zIndex: 1 }}>
 <p style={{ color: '#fff', fontWeight: 900, fontSize: 15, margin: 0, letterSpacing: 2, textTransform: 'uppercase' as const }}>CARTEIRA <span style={{ fontWeight: 300 }}>de</span> FORMAÇÃO</p>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
 <div style={{ flex: 1, height: 0.8, background: 'rgba(255,255,255,0.22)' }} />
 <p style={{ color: GREEN, fontWeight: 700, fontSize: 8.5, margin: 0, letterSpacing: 1.5 }}>CONSULTOR CERTIFICADO</p>
 <div style={{ flex: 1, height: 0.8, background: 'rgba(255,255,255,0.22)' }} />
 </div>
 </div>
 <div style={{ flexShrink: 0, height: 54, display: 'flex', alignItems: 'center', zIndex: 1 }}>
 {logoDireitaUrl ? (
 <img src={logoDireitaUrl} alt={empresaNome} style={{ height: 54, maxWidth: 100, objectFit: 'contain' }} />
 ) : (
 <div style={{ textAlign: 'right' as const }}>
 <p style={{ color: '#fff', fontWeight: 900, fontSize: 11, margin: 0 }}>{empresaNome}</p>
 {tagline && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 6.5, margin: '2px 0 0' }}>{tagline}</p>}
 </div>
 )}
 </div>
 </div>

 {/* Corpo */}
 <div style={{ flex: 1, display: 'flex', padding: '10px 14px', gap: 14, position: 'relative', overflow: 'hidden' }}>
 {/* Marca d'água */}
 <svg style={{ position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none' }} width={W} height="240">
 {Array.from({ length: 18 }).map((_, i) => (
 <ellipse key={`e${i}`} cx={W / 2} cy={120} rx={20 + i * 16} ry={10 + i * 8} fill="none" stroke={NAVY} strokeWidth="0.5" />
 ))}
 {Array.from({ length: 24 }).map((_, i) => (
 <line key={`l${i}`} x1="0" y1={8 + i * 9} x2={W} y2={8 + i * 9} stroke={NAVY} strokeWidth="0.28" strokeDasharray="4 8" />
 ))}
 </svg>
 <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: 0.022 }}>
 <div style={{ fontSize: 150, fontWeight: 900, color: NAVY, transform: 'rotate(-18deg)', whiteSpace: 'nowrap' as const, letterSpacing: -8 }}>{empresaNome} {empresaNome}</div>
 </div>

 {/* Foto 3×4 */}
 <div style={{ flexShrink: 0 }}>
 <div style={{ width: 140, height: 186, border: `2.5px solid ${GREEN}`, borderRadius: 4, overflow: 'hidden', background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
 <svg width="52" height="68" viewBox="0 0 56 72" fill="none">
 <circle cx="28" cy="24" r="14" fill="#ccc" />
 <ellipse cx="28" cy="60" rx="28" ry="17" fill="#ccc" />
 </svg>
 <span style={{ fontSize: 9, color: '#999', fontWeight: 600, textAlign: 'center' as const }}>FOTO 3×4</span>
 </div>
 </div>
 </div>

 {/* Campos */}
 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', minWidth: 0, paddingTop: 2 }}>
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

 {/* Assinatura + Badge */}
 <div style={{ background: '#fafafa', borderTop: '1px solid #ebebeb', padding: '5px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, height: 50 }}>
 <div>
 {assinaturaUrl ? (
 <img src={assinaturaUrl} alt={assinaturaNome} style={{ height: 26, maxWidth: 180, objectFit: 'contain', display: 'block', marginBottom: 1 }} />
 ) : (
 <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 17, color: '#222', margin: 0, lineHeight: 1 }}>{assinaturaNome}</p>
 )}
 <div style={{ width: 90, height: 0.8, background: '#555', margin: '2px 0 1px' }} />
 <p style={{ fontSize: 7, color: '#555', margin: 0, letterSpacing: 0.5, fontWeight: 600 }}>{assinaturaCargo}</p>
 </div>
 <div style={{ background: GREEN, borderRadius: 5, padding: '5px 14px', textAlign: 'center' as const }}>
 <p style={{ color: '#fff', fontWeight: 900, fontSize: 9, margin: 0, letterSpacing: 1 }}>CONSULTOR CERTIFICADO</p>
 <div style={{ width: '100%', height: 0.8, background: 'rgba(255,255,255,0.35)', margin: '2px 0' }} />
 <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 7, margin: 0, letterSpacing: 0.5 }}>— COMPROMISSO • ÉTICA • EXCELÊNCIA —</p>
 </div>
 </div>

 {/* Rodapé */}
 <div style={{ background: GREEN, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', flexShrink: 0 }}>
 <p style={{ color: '#fff', fontSize: 7.5, fontWeight: 700, margin: 0, letterSpacing: 0.5 }}>VÁLIDA EM TODO TERRITÓRIO NACIONAL</p>
 <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 7, margin: 0 }}>VERIFIQUE EM: {urlBase}/verificar/{DEMO_REG}</p>
 </div>
 </div>
 )

 // Verso: texto à ESQUERDA (auto-height), assinatura+QR à DIREITA — sem competição por espaço
 const Verso = () => (
 <div style={{ width: W, height: H, overflow: 'hidden', fontFamily: '"Arial","Helvetica",sans-serif', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>

 {/* Cabeçalho */}
 <div style={{ background: NAVY, height: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
 <svg style={{ position: 'absolute', inset: 0, opacity: 0.07, pointerEvents: 'none' }} width={W} height="70">
 {Array.from({ length: 8 }).map((_, i) => (
 <ellipse key={i} cx={W / 2} cy="35" rx={30 + i * 38} ry={9 + i * 4} fill="none" stroke="#fff" strokeWidth="0.5" />
 ))}
 </svg>
 <p style={{ color: '#fff', fontWeight: 900, fontSize: 19, margin: 0, letterSpacing: 2.5 }}>CONSULTOR CERTIFICADO</p>
 <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10.5, margin: '4px 0 0', letterSpacing: 2 }}>{empresaNome.toUpperCase()}</p>
 </div>

 {/* Corpo: LEFT=texto (flex:1), RIGHT=assinatura+QR (largura fixa) */}
 <div style={{ flex: 1, display: 'flex', padding: '18px 20px', gap: 20, alignItems: 'flex-start', position: 'relative', overflow: 'hidden' }}>
 {/* Marca d'água */}
 <svg style={{ position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none' }} width={W} height="250">
 {Array.from({ length: 14 }).map((_, i) => (
 <ellipse key={`ve${i}`} cx={W / 2} cy={125} rx={35 + i * 22} ry={18 + i * 11} fill="none" stroke={NAVY} strokeWidth="0.5" />
 ))}
 {Array.from({ length: 20 }).map((_, i) => (
 <line key={`vl${i}`} x1="0" y1={6 + i * 12} x2={W} y2={6 + i * 12} stroke={NAVY} strokeWidth="0.25" strokeDasharray="3 6" />
 ))}
 </svg>

 {/* Coluna esquerda: APENAS o texto — altura automática, jamais corta */}
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ border: `1.5px solid ${GREEN}`, borderRadius: 8, padding: '14px 18px' }}>
 <p style={{ fontSize: 11, fontWeight: 700, color: '#111', margin: '0 0 7px', textAlign: 'center' as const, lineHeight: 1.55, letterSpacing: 0.3 }}>
 ESTA CARTEIRA CERTIFICA QUE O PORTADOR<br />
 CONCLUIU COM APROVEITAMENTO O CURSO<br />
 DE FORMAÇÃO DA {empresaNome.toUpperCase()}.
 </p>
 <div style={{ width: '45%', height: 0.8, background: '#ccc', margin: '0 auto 7px' }} />
 <p style={{ fontSize: 10.5, color: '#333', margin: 0, textAlign: 'center' as const, lineHeight: 1.55, letterSpacing: 0.2 }}>
 O PORTADOR ESTÁ HABILITADO A ATUAR COMO<br />
 CONSULTOR AUTORIZADO, SEGUINDO TODOS<br />
 OS PADRÕES DE QUALIDADE, ÉTICA E<br />
 COMPROMISSO DA EMPRESA.
 </p>
 </div>
 </div>

 {/* Coluna direita: assinatura + QR empilhados — largura fixa 110px */}
 <div style={{ width: 110, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
 <div style={{ width: '100%' }}>
 {assinaturaUrl ? (
 <img src={assinaturaUrl} alt={assinaturaNome} style={{ height: 32, maxWidth: 110, objectFit: 'contain', display: 'block', marginBottom: 2 }} />
 ) : (
 <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 15, color: '#222', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{assinaturaNome}</p>
 )}
 <div style={{ height: 0.8, background: '#444', marginBottom: 3 }} />
 <p style={{ fontSize: 7.5, color: '#555', margin: 0, fontWeight: 600, letterSpacing: 0.5 }}>{assinaturaCargo}</p>
 <p style={{ fontSize: 7, color: '#777', margin: 0 }}>{assinaturaEmpresa || empresaNome}</p>
 </div>
 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
 <img src={qrUrl} alt="QR Code" width={88} height={88} style={{ borderRadius: 5, border: '1px solid #ddd', display: 'block' }} />
 <p style={{ fontSize: 7, color: '#999', margin: 0, textAlign: 'center' as const, lineHeight: 1.4 }}>VERIFIQUE<br />AUTENTICIDADE</p>
 </div>
 </div>
 </div>

 {/* Rodapé */}
 <div style={{ background: GREEN, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', flexShrink: 0 }}>
 <div>
 <p style={{ color: '#fff', fontWeight: 800, fontSize: 10, margin: 0 }}>{empresaNome}</p>
 <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 7, margin: '1px 0 0' }}>Nº {DEMO_REG} · Verifique em: {urlBase}</p>
 </div>
 <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 7, margin: 0, fontWeight: 700, letterSpacing: 1 }}>DOCUMENTO AUTÊNTICO</p>
 </div>
 </div>
 )

 const SCALE = 0.58

 return (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
 <div>
 <p style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8, textAlign: 'center' as const }}>FRENTE</p>
 <div style={{ width: W * SCALE, height: H * SCALE, overflow: 'hidden', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
 <div style={{ transform: `scale(${SCALE})`, transformOrigin: 'top left', width: W, height: H }}>
 <Frente />
 </div>
 </div>
 </div>
 <div>
 <p style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8, textAlign: 'center' as const }}>VERSO</p>
 <div style={{ width: W * SCALE, height: H * SCALE, overflow: 'hidden', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
 <div style={{ transform: `scale(${SCALE})`, transformOrigin: 'top left', width: W, height: H }}>
 <Verso />
 </div>
 </div>
 </div>
 </div>
 )
}
