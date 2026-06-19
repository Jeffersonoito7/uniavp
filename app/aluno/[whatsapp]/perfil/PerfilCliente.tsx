'use client'
import { useState, useRef, useEffect } from 'react'
import { Link2, Lock, GraduationCap, UserCheck } from 'lucide-react'
import ImageCropModal from '@/app/components/ImageCropModal'
import PhoneInput from '@/app/components/PhoneInput'

function validarCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i)
  let r = (sum * 10) % 11; if (r === 10 || r === 11) r = 0
  if (r !== parseInt(d[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i)
  r = (sum * 10) % 11; if (r === 10 || r === 11) r = 0
  return r === parseInt(d[10])
}

function formatarCPF(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
}

type Aluno = {
 id: string
 nome: string
 whatsapp: string
 email: string
 cpf?: string | null
 foto_url: string | null
 bio: string | null
 status: string
 numero_registro?: number | null
 data_formacao?: string | null
 link_externo?: string | null
 indicador_id?: string | null
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
 ativo: { label: 'Ativo', color: '#02A153', bg: '#02A15315' },
 concluido: { label: 'Formado', color: '#6366f1', bg: '#6366f115' },
 pausado: { label: 'Pausado', color: '#f59e0b', bg: '#f59e0b15' },
 desligado: { label: 'Desligado', color: '#ef4444', bg: '#ef444415' },
}

export default function PerfilCliente({ aluno, email, podeCfgLink, indicador, avisoCpf }: { aluno: Aluno; email: string; podeCfgLink?: boolean; indicador?: { nome: string; whatsapp: string } | null; avisoCpf?: boolean }) {
 const [siteNome, setSiteNome] = useState('')
 useEffect(() => {
 fetch('/api/site-config').then(r => r.json()).then(d => setSiteNome(d.nome)).catch(() => {})
 }, [])

 const [nome, setNome] = useState(aluno.nome)
 const [bio, setBio] = useState(aluno.bio ?? '')
 const cpfInicial = aluno.cpf ? formatarCPF(aluno.cpf) : ''
 const [cpf, setCpf] = useState(cpfInicial)
 const [salvandoCpf, setSalvandoCpf] = useState(false)
 const [msgCpf, setMsgCpf] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
 const cpfLimpo = cpf.replace(/\D/g, '')
 const cpfValido = validarCPF(cpf)
 const [linkExterno, setLinkExterno] = useState(aluno.link_externo ?? '')
 const [indWpp, setIndWpp] = useState('')
 const [salvandoInd, setSalvandoInd] = useState(false)
 const [msgInd, setMsgInd] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
 const [indicadorSalvo, setIndicadorSalvo] = useState<{ nome: string; whatsapp: string } | null>(indicador ?? null)
 const [fotoUrl, setFotoUrl] = useState<string | null>(aluno.foto_url)
 const [salvando, setSalvando] = useState(false)
 const [uploadando, setUploadando] = useState(false)
 const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)

 // Crop state
 const [cropSrc, setCropSrc] = useState<string | null>(null)
 const [showCrop, setShowCrop] = useState(false)
 const inputFotoRef = useRef<HTMLInputElement>(null)

 function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
 const file = e.target.files?.[0]
 if (!file) return
 setCropSrc(URL.createObjectURL(file))
 setShowCrop(true)
 e.target.value = ''
 }

 async function handleCropSave(_dataUrl: string, blob: Blob) {
 setShowCrop(false)
 setFotoUrl(_dataUrl)
 setUploadando(true)
 const fd = new FormData()
 fd.append('foto', blob, 'foto.jpg')
 const res = await fetch('/api/perfil/foto', { method: 'POST', body: fd })
 const data = await res.json()
 if (data.url) { setFotoUrl(data.url); setMsg({ tipo: 'ok', texto: 'Foto atualizada!' }) }
 else setMsg({ tipo: 'err', texto: data.error ?? 'Erro ao salvar foto.' })
 setUploadando(false)
 setTimeout(() => setMsg(null), 4000)
 }

 async function salvarIndicador(e: React.FormEvent) {
 e.preventDefault()
 const wpp = indWpp.replace(/\D/g, '')
 if (!wpp || wpp.length < 10) { setMsgInd({ tipo: 'err', texto: 'Informe um WhatsApp válido.' }); return }
 if (wpp === aluno.whatsapp.replace(/\D/g, '')) { setMsgInd({ tipo: 'err', texto: 'Você não pode se indicar.' }); return }
 setSalvandoInd(true)
 setMsgInd(null)
 const res = await fetch('/api/perfil', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ aluno_id: aluno.id, indicador_whatsapp: wpp }),
 })
 const data = await res.json()
 if (data.ok) {
 setIndicadorSalvo(data.indicador ?? { nome: 'Indicador', whatsapp: wpp })
 setIndWpp('')
 setMsgInd({ tipo: 'ok', texto: 'Indicador registrado com sucesso!' })
 } else {
 setMsgInd({ tipo: 'err', texto: data.error ?? 'Erro ao registrar indicador.' })
 }
 setSalvandoInd(false)
 setTimeout(() => setMsgInd(null), 5000)
 }

 async function salvar(e: React.FormEvent) {
 e.preventDefault()
 setSalvando(true)
 const res = await fetch('/api/perfil', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ aluno_id: aluno.id, nome, bio, link_externo: podeCfgLink ? linkExterno || null : undefined }),
 })
 const data = await res.json()
 if (data.ok) setMsg({ tipo: 'ok', texto: 'Perfil atualizado!' })
 else setMsg({ tipo: 'err', texto: data.error ?? 'Erro ao salvar.' })
 setSalvando(false)
 setTimeout(() => setMsg(null), 4000)
 }

 async function salvarCpf(e: React.FormEvent) {
 e.preventDefault()
 if (!cpfValido) { setMsgCpf({ tipo: 'err', texto: 'CPF inválido. Verifique os números.' }); return }
 setSalvandoCpf(true)
 setMsgCpf(null)
 const res = await fetch('/api/perfil', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ aluno_id: aluno.id, cpf }),
 })
 const data = await res.json()
 if (data.ok) { setMsgCpf({ tipo: 'ok', texto: 'CPF salvo com sucesso!' }) }
 else { setMsgCpf({ tipo: 'err', texto: data.error ?? 'Erro ao salvar.' }) }
 setSalvandoCpf(false)
 setTimeout(() => setMsgCpf(null), 5000)
 }

 const inp: React.CSSProperties = {
 width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)',
 borderRadius: 10, padding: '11px 14px', color: 'var(--avp-text)',
 fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
 }
 const statusInfo = STATUS_LABEL[aluno.status] ?? STATUS_LABEL.ativo

 return (
 <>
 {showCrop && cropSrc && (
 <ImageCropModal
 src={cropSrc}
 circular
 title="Ajustar foto de perfil"
 onSave={handleCropSave}
 onCancel={() => setShowCrop(false)}
 />
 )}

 <div style={{ minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>

 {/* Header */}
 <header style={{ background: 'var(--avp-card)', borderBottom: '1px solid var(--avp-border)', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
 <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--avp-text)', letterSpacing: '-0.01em' }}>
 {siteNome}
 </span>
 <a href={`/aluno/${aluno.whatsapp}`} style={{ color: 'var(--avp-text-dim)', fontSize: 14, textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
 ← Voltar ao painel
 </a>
 </header>

 <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 60px' }}>

 {/* Banner + avatar */}
 <div style={{ background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: '16px 16px 0 0', height: 120, position: 'relative', marginBottom: 60 }}>
 <div style={{ position: 'absolute', bottom: -52, left: 28, display: 'flex', alignItems: 'flex-end', gap: 16 }}>
 {/* Avatar com botão de edição */}
 <div style={{ position: 'relative' }}>
 <div style={{ width: 104, height: 104, borderRadius: '50%', border: '4px solid var(--avp-black)', overflow: 'hidden', background: 'rgba(79,70,229,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
 onClick={() => inputFotoRef.current?.click()} title="Clique para trocar foto">
 {fotoUrl
 ? <img src={fotoUrl} alt={nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
 : <span style={{ fontSize: 40, fontWeight: 800, color: '#fff' }}>{nome.charAt(0).toUpperCase()}</span>
 }
 {uploadando && (
 <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 <SpinnerCircle />
 </div>
 )}
 </div>
 <button
 onClick={() => inputFotoRef.current?.click()}
 style={{ position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: '50%', background: 'var(--avp-green)', border: '2px solid var(--avp-black)', color: '#fff', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
 title="Trocar foto"
>
 <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
 </button>
 <input ref={inputFotoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFotoChange} />
 </div>
 </div>
 </div>

 {/* Info rápida */}
 <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginBottom: 24 }}>
 <span style={{ background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.color}40`, borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>
 {statusInfo.label}
 </span>
 {aluno.numero_registro && (
 <span style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: 'var(--avp-text-dim)', fontWeight: 600 }}>
 Nº {String(aluno.numero_registro).padStart(6, '0')}
 </span>
 )}
 {aluno.status === 'concluido' && (
 <a href={`/aluno/${aluno.whatsapp}/carteira`} style={{ background: '#fbbf2420', border: '1px solid #fbbf2460', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: '#fbbf24', fontWeight: 700, textDecoration: 'none' }}>
 Ver Carteira
 </a>
 )}
 </div>

 {msg && (
 <div style={{ padding: '12px 16px', background: msg.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 10, color: msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 14, marginBottom: 20 }}>
 {msg.texto}
 </div>
 )}

 {/* Formulário */}
 <form onSubmit={salvar} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, overflow: 'hidden' }}>
 <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--avp-border)' }}>
 <h2 style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>Dados pessoais</h2>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, margin: '4px 0 0' }}>Edite suas informações cadastrais</p>
 </div>

 <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
 <div>
 <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Nome completo *</label>
 <input style={inp} value={nome} onChange={e => setNome(e.target.value)} required placeholder="Seu nome completo" />
 </div>

 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
 <div>
 <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>WhatsApp</label>
 <input style={{ ...inp, opacity: 0.6, cursor: 'not-allowed' }} value={aluno.whatsapp} readOnly tabIndex={-1} />
 </div>
 <div>
 <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>E-mail</label>
 <input style={{ ...inp, opacity: 0.6, cursor: 'not-allowed' }} value={email} readOnly tabIndex={-1} />
 </div>
 </div>

 <div>
 <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Bio</label>
 <textarea style={{ ...inp, resize: 'vertical', minHeight: 90, lineHeight: 1.6 }} value={bio} onChange={e => setBio(e.target.value)} placeholder="Fale um pouco sobre você..." />
 </div>

 {podeCfgLink && (
 <div>
 <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--avp-text-dim)', marginBottom: 6 }}><Link2 size={12} style={{ opacity: 0.6, flexShrink: 0 }} />Meu link da plataforma parceira</label>
 <input style={inp} value={linkExterno} onChange={e => setLinkExterno(e.target.value)} placeholder="Cole aqui o seu link de indicação" />
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>
 Cole exatamente como você recebeu. Aparece para quem você indicar ao completar certas aulas.
 </p>
 </div>
 )}

 {aluno.data_formacao && (
 <div style={{ background: '#6366f115', border: '1px solid #6366f130', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
 <GraduationCap size={22} style={{ color: '#818cf8', flexShrink: 0 }} />
 <div>
 <p style={{ fontSize: 13, fontWeight: 700, color: '#818cf8', margin: 0 }}>Formado em {new Date(aluno.data_formacao + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>Consultor certificado Autovale Prevenções</p>
 </div>
 </div>
 )}

 <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4, borderTop: '1px solid var(--avp-border)' }}>
 <a href={`/aluno/${aluno.whatsapp}`}
 style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
 Cancelar
 </a>
 <button type="submit" disabled={salvando}
 style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 28px', fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: salvando ? 0.7 : 1 }}>
 {salvando ? 'Salvando...' : 'Salvar alterações'}
 </button>
 </div>
 </div>
 </form>

 {/* CPF */}
 <div style={{ background: avisoCpf && !aluno.cpf ? 'rgba(248,113,113,0.06)' : 'var(--avp-card)', border: `1px solid ${avisoCpf && !aluno.cpf ? 'rgba(248,113,113,0.4)' : 'var(--avp-border)'}`, borderRadius: 16, overflow: 'hidden', marginTop: 20 }}>
 <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--avp-border)' }}>
 <h2 style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>CPF</h2>
 {avisoCpf && !aluno.cpf && (
 <p style={{ color: '#f87171', fontSize: 13, margin: '4px 0 0', fontWeight: 600 }}>
 Preencha o CPF para acessar sua carteira digital.
 </p>
 )}
 {!avisoCpf && (
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, margin: '4px 0 0' }}>Obrigatório para emissão da carteira digital</p>
 )}
 </div>
 <div style={{ padding: '20px 24px' }}>
 {msgCpf && (
 <div style={{ padding: '10px 14px', background: msgCpf.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msgCpf.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msgCpf.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 13, marginBottom: 16 }}>
 {msgCpf.texto}
 </div>
 )}
 <form onSubmit={salvarCpf} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
 <div style={{ flex: 1, minWidth: 220 }}>
 <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
 CPF *
 {cpfLimpo.length === 11 && (
 <span style={{ color: cpfValido ? '#22c55e' : '#f87171', textTransform: 'none' }}>
 {cpfValido ? 'valido' : 'invalido'}
 </span>
 )}
 </label>
 <input
 type="text"
 inputMode="numeric"
 placeholder="000.000.000-00"
 value={cpf}
 onChange={e => setCpf(formatarCPF(e.target.value))}
 style={{ ...inp, borderColor: cpfLimpo.length === 11 && !cpfValido ? 'rgba(248,113,113,0.6)' : undefined }}
 />
 </div>
 <button type="submit" disabled={salvandoCpf || !cpfValido}
 style={{ background: cpfValido ? 'var(--avp-green)' : 'var(--avp-border)', color: cpfValido ? '#fff' : 'var(--avp-text-dim)', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 700, cursor: salvandoCpf || !cpfValido ? 'not-allowed' : 'pointer', fontSize: 14, opacity: salvandoCpf ? 0.7 : 1, whiteSpace: 'nowrap' }}>
 {salvandoCpf ? 'Salvando...' : 'Salvar CPF'}
 </button>
 </form>
 </div>
 </div>

 {/* Segurança */}
 <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, overflow: 'hidden', marginTop: 20 }}>
 <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--avp-border)' }}>
 <h2 style={{ fontWeight: 800, fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><Lock size={14} style={{ opacity: 0.6, flexShrink: 0 }} />Segurança</h2>
 </div>
 <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div>
 <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 4px' }}>Senha</p>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, margin: 0 }}>Altere sua senha de acesso</p>
 </div>
 <a href="/recuperar-senha"
 style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', color: 'var(--avp-text)', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
 Alterar senha
 </a>
 </div>
 </div>

 {/* Indicador */}
 <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, overflow: 'hidden', marginTop: 20 }}>
 <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--avp-border)' }}>
 <h2 style={{ fontWeight: 800, fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
 <UserCheck size={14} style={{ opacity: 0.6, flexShrink: 0 }} />Quem te indicou?
 </h2>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, margin: '4px 0 0' }}>
 Informe o WhatsApp de quem te convidou para a plataforma
 </p>
 </div>
 <div style={{ padding: '20px 24px' }}>
 {msgInd && (
 <div style={{ padding: '10px 14px', background: msgInd.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msgInd.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msgInd.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 13, marginBottom: 16 }}>
 {msgInd.texto}
 </div>
 )}
 {indicadorSalvo ? (
 <div style={{ background: '#02A15315', border: '1px solid #02A15340', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
 <UserCheck size={22} style={{ color: 'var(--avp-green)', flexShrink: 0 }} />
 <div>
 <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--avp-green)', margin: 0 }}>Você foi indicado por</p>
 <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--avp-text)', margin: '2px 0 0' }}>{indicadorSalvo.nome}</p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>{indicadorSalvo.whatsapp}</p>
 </div>
 </div>
 ) : (
 <form onSubmit={salvarIndicador} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
 <div style={{ flex: 1, minWidth: 220 }}>
 <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
 WhatsApp de quem te indicou
 </label>
 <PhoneInput value={indWpp} onChange={setIndWpp} style={{ background: 'var(--avp-black)', borderRadius: 10 }} />
 </div>
 <button type="submit" disabled={salvandoInd || !indWpp}
 style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 700, cursor: salvandoInd || !indWpp ? 'not-allowed' : 'pointer', fontSize: 14, opacity: salvandoInd || !indWpp ? 0.6 : 1 }}>
 {salvandoInd ? 'Salvando...' : 'Salvar'}
 </button>
 </form>
 )}
 </div>
 </div>

 </div>
 </div>

 </>
 )
}

function SpinnerCircle() {
 const [deg, setDeg] = useState(0)
 useEffect(() => {
 const id = setInterval(() => setDeg(d => (d + 12) % 360), 33)
 return () => clearInterval(id)
 }, [])
 return (
 <div style={{ width: 24, height: 24, border: '3px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', transform: `rotate(${deg}deg)` }} />
 )
}
