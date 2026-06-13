'use client'
import { useState, useRef } from 'react'
import ImageCropModal from '@/app/components/ImageCropModal'

const NAVY_DEFAULT = '#0D2B6E'
const GREEN_DEFAULT = '#0A7A42'

const W = 620
const H = 390

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
 corPrimaria?: string
 corSecundaria?: string
}

function Field({ label, value, flex, labelColor = '#1A7A50' }: { label: string; value: string; flex?: boolean; labelColor?: string }) {
 return (
 <div style={{ flex: flex ? 1 : undefined, minWidth: 0 }}>
 <p style={{ fontSize: 7, fontWeight: 700, color: labelColor, margin: '0 0 1px', letterSpacing: 0.8, textTransform: 'uppercase' as const }}>{label}</p>
 <p style={{ fontSize: 11.5, fontWeight: 600, color: '#1a1a1a', margin: '0 0 5px', borderBottom: '1px solid #ddd', paddingBottom: 1, lineHeight: 1.2, wordBreak: 'break-word' as const }}>{value || '—'}</p>
 </div>
 )
}

export default function CarteiraDisplay({
 nome, numRegistro, fotoUrl: fotoInicial, dataFormacao, validade, cargaHoraria, turma,
 whatsapp, status, empresaNome = 'UNIVERSIDADE', empresaLogoUrl,
 logoEsquerdaUrl, logoDireitaUrl, assinaturaNome = 'Presidente', assinaturaCargo = 'PRESIDENTE',
 assinaturaEmpresa, assinaturaUrl, urlVerificacao = '', tagline = '', corPrimaria, corSecundaria,
}: Props) {
 const NAVY = corPrimaria || NAVY_DEFAULT
 const GREEN = corSecundaria || GREEN_DEFAULT
 const GREEN_LABEL = corSecundaria || '#1A7A50'
 const [fotoUrl, setFotoUrl] = useState<string | null>(fotoInicial)
 const [uploadando, setUploadando] = useState(false)
 const [msgFoto, setMsgFoto] = useState('')
 const [cropSrc, setCropSrc] = useState<string | null>(null)
 const fotoRef = useRef<HTMLInputElement>(null)

 const urlBase = (urlVerificacao || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/^https?:\/\//, '').replace(/\/$/, '')
 const urlFull = urlVerificacao?.startsWith('http') ? urlVerificacao : `https://${urlBase}`
 const verificacaoLink = `${urlFull}/verificar/${numRegistro}`
 const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(verificacaoLink)}&color=0A7A42&bgcolor=ffffff`

 function handleFotoSelecionada(e: React.ChangeEvent<HTMLInputElement>) {
 const file = e.target.files?.[0]
 if (!file) return
 setCropSrc(URL.createObjectURL(file))
 e.target.value = ''
 }

 async function handleCropSalvo(_dataUrl: string, blob: Blob) {
 setCropSrc(null)
 setFotoUrl(_dataUrl)
 setUploadando(true)
 const fd = new FormData()
 fd.append('foto', blob, 'foto.jpg')
 const res = await fetch('/api/aluno/foto-carteira', { method: 'POST', body: fd })
 const data = await res.json()
 if (data.url) { setFotoUrl(data.url); setMsgFoto('Foto salva!') }
 else setMsgFoto('Erro ao salvar foto.')
 setUploadando(false)
 setTimeout(() => setMsgFoto(''), 3000)
 }

 const CardFrente = () => (
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
 ) : empresaLogoUrl ? (
 <img src={empresaLogoUrl} alt={empresaNome} style={{ height: 46, maxWidth: 100, objectFit: 'contain' }} />
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
 {Array.from({ length: 12 }).map((_, i) => (
 <ellipse key={`r${i}`} cx={90} cy={80} rx={6 + i * 6} ry={3 + i * 3} fill="none" stroke={NAVY} strokeWidth="0.4" transform={`rotate(${i * 15} 90 80)`} />
 ))}
 {Array.from({ length: 24 }).map((_, i) => (
 <line key={`l${i}`} x1="0" y1={8 + i * 9} x2={W} y2={8 + i * 9} stroke={NAVY} strokeWidth="0.28" strokeDasharray="4 8" />
 ))}
 </svg>
 <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: 0.022 }}>
 <div style={{ fontSize: 150, fontWeight: 900, color: NAVY, transform: 'rotate(-18deg)', whiteSpace: 'nowrap' as const, letterSpacing: -8 }}>
 {empresaNome} {empresaNome}
 </div>
 </div>

 {/* Foto 3×4 com upload */}
 <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
 <div
 onClick={() => fotoRef.current?.click()}
 style={{ width: 140, height: 186, border: `2.5px solid ${GREEN}`, borderRadius: 4, overflow: 'hidden', background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
>
 {fotoUrl ? (
 <>
 <img src={fotoUrl} alt={nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
 <div className="no-print" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 5, opacity: 0, transition: 'opacity 0.2s' }}
 onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
 onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
 <span style={{ background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 8, padding: '2px 6px', borderRadius: 3, fontWeight: 600 }}>Trocar foto</span>
 </div>
 </>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
 <svg width="52" height="68" viewBox="0 0 56 72" fill="none">
 <circle cx="28" cy="24" r="14" fill="#bbb" />
 <ellipse cx="28" cy="60" rx="28" ry="17" fill="#bbb" />
 </svg>
 <span style={{ fontSize: 9, color: '#888', fontWeight: 600, textAlign: 'center' as const, lineHeight: 1.3, padding: '0 4px' }}>Toque para{'\n'}adicionar foto</span>
 </div>
 )}
 {uploadando && (
 <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 <span style={{ color: '#fff', fontSize: 9 }}>Salvando...</span>
 </div>
 )}
 </div>
 <input ref={fotoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFotoSelecionada} />
 <button className="no-print" onClick={() => fotoRef.current?.click()}
 style={{ marginTop: 4, background: GREEN, color: '#fff', border: 'none', borderRadius: 3, padding: '3px 0', fontSize: 8, fontWeight: 700, cursor: 'pointer', width: 140 }}>
 {fotoUrl ? 'Trocar foto' : 'Adicionar foto'}
 </button>
 </div>

 {/* Campos */}
 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', minWidth: 0, paddingTop: 2 }}>
 <Field label="Nome do Consultor" value={nome} labelColor={GREEN_LABEL} />
 <Field label="Nº de Registro" value={numRegistro} labelColor={GREEN_LABEL} />
 <div style={{ display: 'flex', gap: 10 }}>
 <Field label="Data de Formação" value={dataFormacao} flex labelColor={GREEN_LABEL} />
 <Field label="Validade" value={validade} flex labelColor={GREEN_LABEL} />
 </div>
 <Field label="Curso de Formação" value={`Formação de Consultor ${empresaNome}`} labelColor={GREEN_LABEL} />
 <div style={{ display: 'flex', gap: 10 }}>
 <Field label="Carga Horária" value={cargaHoraria} flex labelColor={GREEN_LABEL} />
 <Field label="Turma" value={turma} flex labelColor={GREEN_LABEL} />
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
 <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 7, margin: 0 }}>VERIFIQUE EM: {urlBase}/verificar/{numRegistro}</p>
 </div>
 </div>
 )

 const CardVerso = () => (
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

 {/* Corpo: LEFT=texto (flex:1 horizontal), RIGHT=assinatura+QR (110px fixo) */}
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

 {/* Coluna esquerda: APENAS o texto de certificação — altura automática */}
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

 {/* Coluna direita: assinatura + QR — 110px fixo, sem competição com o texto */}
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
 {empresaLogoUrl
 ? <img src={empresaLogoUrl} alt={empresaNome} style={{ height: 18, maxWidth: 70, objectFit: 'contain' }} />
 : <p style={{ color: '#fff', fontWeight: 800, fontSize: 10, margin: 0 }}>{empresaNome}</p>}
 <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 7, margin: '1px 0 0' }}>Nº {numRegistro} · Verifique em: {urlBase}</p>
 </div>
 <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 7, margin: 0, fontWeight: 700, letterSpacing: 1 }}>DOCUMENTO AUTÊNTICO</p>
 </div>
 </div>
 )

 return (
 <>
 {cropSrc && (
 <ImageCropModal src={cropSrc} aspectRatio={3 / 4} title="Ajustar foto 3x4"
 onSave={handleCropSalvo} onCancel={() => setCropSrc(null)} />
 )}
 <div className="print-container" style={{ minHeight: '100dvh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>
 <style>{`
 @media print {
 @page { size: A4 landscape; margin: 10mm; }
 * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
 html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
 .no-print { display: none !important; }
 .print-container { background: #fff !important; min-height: 0 !important; color: #000 !important; }
 .print-area { padding: 0 !important; max-width: 100% !important; display: flex !important; flex-direction: column !important; align-items: center !important; gap: 10mm !important; }
 .card-wrapper { page-break-inside: avoid !important; break-inside: avoid !important; }
 }
 `}</style>

 <header className="no-print" style={{ background: 'rgba(8,9,13,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--avp-border)', padding: '0 24px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
 <a href={`/aluno/${whatsapp}`} style={{ color: 'var(--avp-text-dim)', textDecoration: 'none', fontSize: 14 }}>← Meu Painel</a>
 <h1 style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>Carteira de Formação</h1>
 <div style={{ display: 'flex', gap: 10 }}>
 {msgFoto && <span style={{ color: 'var(--avp-green)', fontSize: 13, alignSelf: 'center' }}>{msgFoto}</span>}
 <a href={verificacaoLink} target="_blank" rel="noreferrer"
 style={{ background: 'var(--avp-blue)', color: '#fff', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
 Verificar autenticidade
 </a>
 <button onClick={() => window.print()}
 style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
 Imprimir / PDF
 </button>
 </div>
 </header>

 <div className="no-print" style={{ maxWidth: 700, margin: '24px auto 0', padding: '0 24px' }}>
 {status !== 'concluido' && (
 <div style={{ background: '#f59e0b15', border: '1px solid #f59e0b50', borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
 <div>
 <p style={{ fontWeight: 700, color: '#f59e0b', margin: '0 0 4px', fontSize: 14 }}>Curso em andamento</p>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, margin: 0 }}>Sua carteira ficará completa quando você concluir todos os módulos.</p>
 </div>
 </div>
 )}
 <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '12px 18px', marginBottom: 20 }}>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, margin: 0 }}>
 <strong style={{ color: 'var(--avp-text)' }}>Foto 3×4:</strong> Clique na área da foto na carteira abaixo para adicionar ou trocar.
 </p>
 </div>
 </div>

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
 </>
 )
}
