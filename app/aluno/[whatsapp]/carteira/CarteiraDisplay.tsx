'use client'
import { useState, useRef } from 'react'

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
  assinaturaNome?: string
  assinaturaCargo?: string
  assinaturaEmpresa?: string
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

export default function CarteiraDisplay({ nome, numRegistro, fotoUrl: fotoInicial, dataFormacao, validade, cargaHoraria, turma, whatsapp, status, empresaNome = 'UNIVERSIDADE', empresaLogoUrl, assinaturaNome = 'Assinatura', assinaturaCargo = 'PRESIDENTE', assinaturaEmpresa, urlVerificacao = '', tagline = '' }: Props) {
  const [fotoUrl, setFotoUrl] = useState<string | null>(fotoInicial)
  const [uploadando, setUploadando] = useState(false)
  const [msgFoto, setMsgFoto] = useState('')
  const fotoRef = useRef<HTMLInputElement>(null)

  const verificacaoUrl = urlVerificacao || 'WWW.SUAEMPRESA.COM.BR'

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

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${verificacaoUrl.toLowerCase()}&color=0A7A42&bgcolor=ffffff`

  // Frente e verso do cartão
  const CardFrente = () => (
    <div style={{ width: 620, height: 390, position: 'relative', overflow: 'hidden', fontFamily: '"Arial", "Helvetica", sans-serif', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>

      {/* Cabeçalho */}
      <div style={{ background: NAVY, height: 78, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14, flexShrink: 0 }}>
        {/* Logo AVP */}
        <div style={{ width: 54, height: 54, border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5, fontWeight: 600 }}>UNIVERSIDADE</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, margin: '2px 0' }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', lineHeight: 1 }}>A</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', lineHeight: 1 }}>V</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: GREEN, lineHeight: 1 }}>P</span>
            <div style={{ width: 13, height: 13, background: 'rgba(255,255,255,0.1)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN }} />
            </div>
          </div>
        </div>

        {/* Título */}
        <div style={{ flex: 1 }}>
          <p style={{ color: '#fff', fontWeight: 900, fontSize: 17, margin: 0, letterSpacing: 1.5, textTransform: 'uppercase' as const }}>CARTEIRA <span style={{ fontWeight: 400 }}>de</span> FORMAÇÃO</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
            <div style={{ width: 36, height: 2, background: GREEN }} />
            <p style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 700, fontSize: 10, margin: 0, letterSpacing: 2 }}>CONSULTOR CERTIFICADO</p>
          </div>
        </div>

        {/* Logo empresa */}
        <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
          {empresaLogoUrl ? (
            <img src={empresaLogoUrl} alt={empresaNome} style={{ height: 48, maxWidth: 120, objectFit: 'contain' }} />
          ) : (
            <p style={{ color: '#fff', fontWeight: 900, fontSize: 13, margin: 0, letterSpacing: 0.5, maxWidth: 120, textAlign: 'right' as const }}>{empresaNome}</p>
          )}
          {tagline && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 7, margin: '3px 0 0', letterSpacing: 0.3 }}>{tagline}</p>}
        </div>
      </div>

      {/* Corpo */}
      <div style={{ flex: 1, background: '#fff', display: 'flex', padding: '14px 18px', gap: 16, position: 'relative', overflow: 'hidden' }}>
        {/* Marca d'água */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: 0.035 }}>
          <div style={{ fontSize: 200, fontWeight: 900, color: NAVY, transform: 'rotate(-20deg)', letterSpacing: -10, whiteSpace: 'nowrap' as const }}>AVP AVP</div>
        </div>
        {/* Grade guilloche */}
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none' }} width="620" height="232" xmlns="http://www.w3.org/2000/svg">
          {Array.from({ length: 12 }).map((_, i) => (
            <ellipse key={i} cx="310" cy="116" rx={40 + i * 26} ry={20 + i * 13} fill="none" stroke={NAVY} strokeWidth="0.6" />
          ))}
        </svg>

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
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 20, color: '#222', margin: 0, lineHeight: 1 }}>{assinaturaNome}</p>
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
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 7.5, margin: 0, letterSpacing: 0.3 }}>VERIFIQUE A AUTENTICIDADE EM: {verificacaoUrl}</p>
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
        {/* Grade guilloche */}
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none' }} width="620" height="250" xmlns="http://www.w3.org/2000/svg">
          {Array.from({ length: 10 }).map((_, i) => (
            <ellipse key={i} cx="310" cy="125" rx={50 + i * 28} ry={25 + i * 14} fill="none" stroke={NAVY} strokeWidth="0.6" />
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
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 24, color: '#222', margin: '0 0 2px' }}>{assinaturaNome}</p>
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
          <button
            onClick={() => window.print()}
            style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
          >
            🖨 Imprimir / Salvar PDF
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
