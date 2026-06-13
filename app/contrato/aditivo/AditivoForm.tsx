'use client'
import { useState, useRef } from 'react'

type Props = {
 contratanteNome: string
 contratoNome: string
 contratoNumero: string
 whatsapp: string
 bg: string
 cor: string
}

function formatarCNPJ(v: string) {
 const d = v.replace(/\D/g, '').slice(0, 14)
 if (d.length <= 2) return d
 if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`
 if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`
 if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`
 return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`
}

function formatarCPF(v: string) {
 const d = v.replace(/\D/g, '').slice(0, 11)
 if (d.length <= 3) return d
 if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
 if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
 return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
}

function validarCNPJ(cnpj: string) {
 const d = cnpj.replace(/\D/g, '')
 if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false
 const calc = (n: number) => {
 let sum = 0, pos = n - 7
 for (let i = n; i>= 1; i--) { sum += parseInt(d[n - i]) * pos--; if (pos < 2) pos = 9 }
 const r = sum % 11
 return r < 2 ? 0 : 11 - r
 }
 return calc(12) === parseInt(d[12]) && calc(13) === parseInt(d[13])
}

function validarCPF(cpf: string) {
 const d = cpf.replace(/\D/g, '')
 if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
 const c = (n: number) => { let s = 0; for (let i = 0; i < n; i++) s += parseInt(d[i]) * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r }
 return c(9) === parseInt(d[9]) && c(10) === parseInt(d[10])
}

type Etapa = 'escolha' | 'cnpj' | 'terceiro' | 'assinatura' | 'sucesso'

export default function AditivoForm({ contratanteNome, contratoNome, contratoNumero, whatsapp, bg, cor }: Props) {
 const [etapa, setEtapa] = useState<Etapa>('escolha')
 const [escolha, setEscolha] = useState<'proprio' | 'terceiro' | null>(null)

 // Campos CNPJ proprio
 const [cnpj, setCnpj] = useState('')
 const [rua, setRua] = useState('')
 const [numero, setNumero] = useState('')
 const [bairro, setBairro] = useState('')
 const [cidade, setCidade] = useState('')
 const [estado, setEstado] = useState('')
 const [cep, setCep] = useState('')
 const [buscandoCep, setBuscandoCep] = useState(false)

 // Campos terceiro
 const [nfEmpresaNome, setNfEmpresaNome] = useState('')
 const [nfEmpresaCnpj, setNfEmpresaCnpj] = useState('')
 const [nfResponsavelNome, setNfResponsavelNome] = useState('')
 const [nfResponsavelCpf, setNfResponsavelCpf] = useState('')

 // Assinatura
 const canvasRef = useRef<HTMLCanvasElement>(null)
 const [desenhando, setDesenhando] = useState(false)
 const [temAssinatura, setTemAssinatura] = useState(false)
 const [enviando, setEnviando] = useState(false)
 const [erro, setErro] = useState('')

 const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 5 }
 const inp: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }

 const cnpjLen = cnpj.replace(/\D/g, '').length
 const cnpjValido = cnpjLen === 0 || validarCNPJ(cnpj)
 const nfCnpjLen = nfEmpresaCnpj.replace(/\D/g, '').length
 const nfCnpjValido = nfCnpjLen === 0 || validarCNPJ(nfEmpresaCnpj)
 const nfCpfLen = nfResponsavelCpf.replace(/\D/g, '').length
 const nfCpfValido = nfCpfLen === 0 || validarCPF(nfResponsavelCpf)

 const sedeMei = [rua, numero, bairro, cidade, estado, cep].filter(Boolean).join(', ')

 const podeProsseguirCnpj = cnpjLen === 14 && cnpjValido && rua && numero && bairro && cidade && estado && cep
 const podeProsseguirTerceiro = nfEmpresaNome && nfCnpjValido && nfResponsavelNome && nfCpfValido

 async function buscarCep(val: string) {
 const d = val.replace(/\D/g, '')
 if (d.length !== 8) return
 setBuscandoCep(true)
 try {
 const res = await fetch(`https://viacep.com.br/ws/${d}/json/`)
 const data = await res.json()
 if (!data.erro) {
 setRua(data.logradouro || '')
 setBairro(data.bairro || '')
 setCidade(data.localidade || '')
 setEstado(data.uf || '')
 }
 } catch { /* ignora */ }
 setBuscandoCep(false)
 }

 // Canvas assinatura
 function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
 const rect = canvas.getBoundingClientRect()
 const scaleX = canvas.width / rect.width
 const scaleY = canvas.height / rect.height
 if ('touches' in e) {
 return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
 }
 return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
 }

 function iniciarDesenho(e: React.MouseEvent | React.TouchEvent) {
 e.preventDefault()
 const canvas = canvasRef.current; if (!canvas) return
 const ctx = canvas.getContext('2d'); if (!ctx) return
 const pos = getPos(e, canvas)
 ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
 setDesenhando(true)
 }

 function desenhar(e: React.MouseEvent | React.TouchEvent) {
 if (!desenhando) return
 e.preventDefault()
 const canvas = canvasRef.current; if (!canvas) return
 const ctx = canvas.getContext('2d'); if (!ctx) return
 const pos = getPos(e, canvas)
 ctx.lineTo(pos.x, pos.y); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.stroke()
 setTemAssinatura(true)
 }

 function pararDesenho() { setDesenhando(false) }

 function limparAssinatura() {
 const canvas = canvasRef.current; if (!canvas) return
 const ctx = canvas.getContext('2d'); if (!ctx) return
 ctx.clearRect(0, 0, canvas.width, canvas.height)
 setTemAssinatura(false)
 }

 async function enviar() {
 setEnviando(true); setErro('')
 const canvas = canvasRef.current
 const assinatura_base64 = canvas && temAssinatura ? canvas.toDataURL('image/png') : null

 const nfDados = escolha === 'terceiro' ? {
 emite_proprio: false,
 empresa_nome: nfEmpresaNome,
 empresa_cnpj: nfEmpresaCnpj.replace(/\D/g, '') || null,
 responsavel_nome: nfResponsavelNome,
 responsavel_cpf: nfResponsavelCpf.replace(/\D/g, '') || null,
 } : null

 try {
 const res = await fetch('/api/contrato/aditivo', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 whatsapp,
 cnpj: escolha === 'proprio' ? cnpj : null,
 endereco: escolha === 'proprio' ? sedeMei : null,
 nf_emite_proprio: escolha === 'proprio',
 nf_dados: nfDados,
 assinatura_base64,
 }),
 })
 const data = await res.json()
 if (!res.ok) { setErro(data.error || 'Erro ao enviar.'); setEnviando(false); return }
 setEtapa('sucesso')
 } catch {
 setErro('Erro de conexão. Tente novamente.')
 }
 setEnviando(false)
 }

 const cardStyle: React.CSSProperties = {
 background: 'rgba(10,22,40,0.85)', border: '1px solid rgba(99,102,241,0.25)',
 borderRadius: 20, padding: 32, backdropFilter: 'blur(12px)',
 }

 if (etapa === 'sucesso') {
 return (
 <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', fontFamily: 'Inter,sans-serif' }}>
 <div style={{ width: '100%', maxWidth: 520 }}>
 <div style={{ ...cardStyle, textAlign: 'center' }}>
 <div style={{ fontSize: 48, marginBottom: 16 }}></div>
 <p style={{ fontWeight: 800, fontSize: 20, color: '#fff', margin: '0 0 10px' }}>Aditivo assinado!</p>
 <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
 Seu contrato foi atualizado com os dados informados.<br />
 O PDF atualizado será enviado para o seu WhatsApp em instantes.
 </p>
 </div>
 </div>
 </div>
 )
 }

 return (
 <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', fontFamily: 'Inter,sans-serif' }}>
 <div style={{ width: '100%', maxWidth: 560 }}>
 {/* Cabecalho */}
 <div style={{ textAlign: 'center', marginBottom: 28 }}>
 <div style={{ display: 'inline-block', background: 'rgba(99,102,241,0.12)', border: '2px solid #6366f1', borderRadius: 16, padding: '12px 32px', marginBottom: 12 }}>
 <p style={{ fontWeight: 900, fontSize: 13, color: '#818cf8', margin: 0, letterSpacing: 2, textTransform: 'uppercase' }}>Aditivo Contratual</p>
 <p style={{ fontWeight: 800, fontSize: 20, color: '#fff', margin: '6px 0 0' }}>{contratanteNome}</p>
 </div>
 <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 20px', display: 'inline-block' }}>
 <p style={{ margin: 0, fontSize: 14, color: '#fff', fontWeight: 700 }}>{contratoNome}</p>
 <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Contrato {contratoNumero} — atualização de dados</p>
 </div>
 </div>

 <div style={cardStyle}>
 {/* ETAPA: escolha */}
 {etapa === 'escolha' && (
 <>
 <p style={{ fontWeight: 700, fontSize: 14, color: '#818cf8', marginBottom: 6 }}>Como vai funcionar a emissão de Nota Fiscal?</p>
 <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20, lineHeight: 1.6 }}>
 Escolha a situação que se aplica a você agora.
 </p>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
 {[
 { val: 'proprio' as const, label: 'Abri meu CNPJ — vou emitir minha própria Nota Fiscal', sub: 'Você preencherá seu CNPJ e endereço da empresa.' },
 { val: 'terceiro' as const, label: 'Outra empresa / pessoa vai emitir por mim', sub: 'Você autoriza outra empresa ou pessoa a emitir e receber em seu nome.' },
 ].map(op => (
 <label key={op.val} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: escolha === op.val ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${escolha === op.val ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 12, padding: '16px 18px', cursor: 'pointer' }}
 onClick={() => setEscolha(op.val)}>
 <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${escolha === op.val ? '#6366f1' : 'rgba(255,255,255,0.25)'}`, background: escolha === op.val ? '#6366f1' : 'transparent', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 {escolha === op.val && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'block' }} />}
 </div>
 <div>
 <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>{op.label}</p>
 <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: '4px 0 0' }}>{op.sub}</p>
 </div>
 </label>
 ))}
 </div>
 <button onClick={() => setEtapa(escolha === 'proprio' ? 'cnpj' : 'terceiro')} disabled={!escolha}
 style={{ marginTop: 24, width: '100%', background: escolha ? cor : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 15, color: escolha ? '#fff' : 'rgba(255,255,255,0.35)', cursor: escolha ? 'pointer' : 'not-allowed' }}>
 Continuar →
 </button>
 </>
 )}

 {/* ETAPA: cnpj proprio */}
 {etapa === 'cnpj' && (
 <>
 <p style={{ fontWeight: 700, fontSize: 14, color: '#818cf8', marginBottom: 20 }}> Dados do seu CNPJ</p>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
 <div>
 <label style={lbl}>
 CNPJ *
 {cnpjLen === 14 && (
 <span style={{ marginLeft: 8, color: cnpjValido ? '#22c55e' : '#f87171', fontWeight: 700 }}>
 {cnpjValido ? ' válido' : ' inválido'}
 </span>
 )}
 </label>
 <input style={{ ...inp, borderColor: cnpjLen === 14 && !cnpjValido ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.15)' }}
 value={cnpj} onChange={e => setCnpj(formatarCNPJ(e.target.value))} placeholder="00.000.000/0000-00" />
 </div>
 <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '-6px 0 0' }}>Endereço da empresa:</p>
 <div>
 <label style={lbl}>CEP * {buscandoCep && <span style={{ fontWeight: 400, fontSize: 11, color: '#818cf8' }}>buscando...</span>}</label>
 <input style={inp} value={cep}
 onChange={e => {
 const val = e.target.value.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
 setCep(val); buscarCep(val)
 }}
 placeholder="00000-000" maxLength={9} />
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12 }}>
 <div>
 <label style={lbl}>Rua / Avenida *</label>
 <input style={inp} value={rua} onChange={e => setRua(e.target.value)} placeholder="Rua das Flores" />
 </div>
 <div>
 <label style={lbl}>Numero *</label>
 <input style={inp} value={numero} onChange={e => setNumero(e.target.value)} placeholder="123" />
 </div>
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
 <div>
 <label style={lbl}>Bairro *</label>
 <input style={inp} value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Centro" />
 </div>
 <div>
 <label style={lbl}>Cidade *</label>
 <input style={inp} value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Petrolina" />
 </div>
 </div>
 <div style={{ width: 80 }}>
 <label style={lbl}>UF *</label>
 <input style={inp} value={estado} onChange={e => setEstado(e.target.value.toUpperCase().slice(0, 2))} placeholder="PE" maxLength={2} />
 </div>
 </div>
 <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
 <button onClick={() => setEtapa('escolha')}
 style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 14, fontWeight: 600, fontSize: 14, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
 Voltar
 </button>
 <button onClick={() => setEtapa('assinatura')} disabled={!podeProsseguirCnpj}
 style={{ flex: 2, background: podeProsseguirCnpj ? cor : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 12, padding: 14, fontWeight: 700, fontSize: 14, color: podeProsseguirCnpj ? '#fff' : 'rgba(255,255,255,0.35)', cursor: podeProsseguirCnpj ? 'pointer' : 'not-allowed' }}>
 Assinar aditivo →
 </button>
 </div>
 </>
 )}

 {/* ETAPA: terceiro */}
 {etapa === 'terceiro' && (
 <>
 <p style={{ fontWeight: 700, fontSize: 14, color: '#818cf8', marginBottom: 6 }}> Dados de quem vai emitir por você</p>
 <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 18, lineHeight: 1.6 }}>
 Preencha os dados da empresa ou pessoa que vai emitir a Nota Fiscal e receber em seu nome.
 </p>
 <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
 <div>
 <label style={lbl}>Razão social da empresa emissora *</label>
 <input style={inp} value={nfEmpresaNome} onChange={e => setNfEmpresaNome(e.target.value)} placeholder="Ex: ABC Serviços Ltda" />
 </div>
 <div>
 <label style={lbl}>
 CNPJ da empresa emissora
 {nfCnpjLen === 14 && (
 <span style={{ marginLeft: 8, color: nfCnpjValido ? '#22c55e' : '#f87171', fontWeight: 700 }}>
 {nfCnpjValido ? ' válido' : ' inválido'}
 </span>
 )}
 </label>
 <input style={{ ...inp, borderColor: nfCnpjLen === 14 && !nfCnpjValido ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.15)' }}
 value={nfEmpresaCnpj} onChange={e => setNfEmpresaCnpj(formatarCNPJ(e.target.value))} placeholder="00.000.000/0001-00" />
 </div>
 <div>
 <label style={lbl}>Nome do responsável que receberá em seu nome *</label>
 <input style={inp} value={nfResponsavelNome} onChange={e => setNfResponsavelNome(e.target.value)} placeholder="Nome completo" />
 </div>
 <div>
 <label style={lbl}>
 CPF do responsável
 {nfCpfLen === 11 && (
 <span style={{ marginLeft: 8, color: nfCpfValido ? '#22c55e' : '#f87171', fontWeight: 700 }}>
 {nfCpfValido ? ' válido' : ' inválido'}
 </span>
 )}
 </label>
 <input style={{ ...inp, borderColor: nfCpfLen === 11 && !nfCpfValido ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.15)' }}
 value={nfResponsavelCpf} onChange={e => setNfResponsavelCpf(formatarCPF(e.target.value))} placeholder="000.000.000-00" />
 </div>
 <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0, lineHeight: 1.6 }}>
 Ao assinar, você autoriza expressamente a empresa e o responsável acima a emitir notas fiscais e receber pagamentos em seu nome.
 </p>
 </div>
 <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
 <button onClick={() => setEtapa('escolha')}
 style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 14, fontWeight: 600, fontSize: 14, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
 Voltar
 </button>
 <button onClick={() => setEtapa('assinatura')} disabled={!podeProsseguirTerceiro}
 style={{ flex: 2, background: podeProsseguirTerceiro ? cor : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 12, padding: 14, fontWeight: 700, fontSize: 14, color: podeProsseguirTerceiro ? '#fff' : 'rgba(255,255,255,0.35)', cursor: podeProsseguirTerceiro ? 'pointer' : 'not-allowed' }}>
 Assinar aditivo →
 </button>
 </div>
 </>
 )}

 {/* ETAPA: assinatura */}
 {etapa === 'assinatura' && (
 <>
 <p style={{ fontWeight: 700, fontSize: 14, color: '#818cf8', marginBottom: 6 }}> Assine o aditivo</p>
 <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 16, lineHeight: 1.6 }}>
 Desenhe sua assinatura abaixo para confirmar o aditivo contratual.
 </p>
 <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1.5px solid rgba(99,102,241,0.4)', background: 'rgba(255,255,255,0.03)', marginBottom: 12 }}>
 <canvas ref={canvasRef} width={520} height={180} style={{ width: '100%', display: 'block', touchAction: 'none', cursor: 'crosshair' }}
 onMouseDown={iniciarDesenho} onMouseMove={desenhar} onMouseUp={pararDesenho} onMouseLeave={pararDesenho}
 onTouchStart={iniciarDesenho} onTouchMove={desenhar} onTouchEnd={pararDesenho} />
 {!temAssinatura && (
 <p style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'rgba(255,255,255,0.2)', margin: 0, pointerEvents: 'none' }}>
 Assine aqui
 </p>
 )}
 </div>
 {temAssinatura && (
 <button onClick={limparAssinatura}
 style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', padding: '0 0 12px' }}>
 Limpar e assinar novamente
 </button>
 )}
 {erro && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{erro}</p>}
 <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
 <button onClick={() => setEtapa(escolha === 'proprio' ? 'cnpj' : 'terceiro')}
 style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 14, fontWeight: 600, fontSize: 14, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
 Voltar
 </button>
 <button onClick={enviar} disabled={!temAssinatura || enviando}
 style={{ flex: 2, background: temAssinatura && !enviando ? '#22c55e' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 12, padding: 14, fontWeight: 700, fontSize: 14, color: temAssinatura && !enviando ? '#fff' : 'rgba(255,255,255,0.35)', cursor: temAssinatura && !enviando ? 'pointer' : 'not-allowed' }}>
 {enviando ? 'Enviando...' : 'Confirmar aditivo'}
 </button>
 </div>
 </>
 )}
 </div>
 </div>
 </div>
 )
}
