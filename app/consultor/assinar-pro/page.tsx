'use client'
import { useEffect, useState } from 'react'
import { QrCode, CheckCircle, CreditCard, Zap, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Pagamento = {
 pix_copia_cola: string | null
 qrcode_base64: string | null
 vencimento: string
 status: string
 tipo?: string
 payment_url?: string | null
}

type Info = {
 jaEhPro: boolean
 valorPlano: number
 valorAnual: number
 nomeSite?: string
 ultimoPagamento: Pagamento | null
}

export default function AssinarProPage() {
 const [info, setInfo] = useState<Info | null>(null)
 const [opcao, setOpcao] = useState<'pix' | 'cartao' | null>(null)
 const [gerando, setGerando] = useState(false)
 const [copiado, setCopiado] = useState(false)
 const [msg, setMsg] = useState('')
 const router = useRouter()

 useEffect(() => {
 fetch('/api/consultor/assinar-pro').then(r => r.json()).then(setInfo)
 }, [])

 // Polling: detecta confirmação e redireciona
 useEffect(() => {
 if (info?.ultimoPagamento?.status !== 'pendente') return
 let tentativas = 0
 const id = setInterval(async () => {
 if (++tentativas > 120) { clearInterval(id); return }
 try {
 const r = await fetch('/api/consultor/assinar-pro')
 const d = await r.json()
 if (d.jaEhPro) { clearInterval(id); router.push('/gestor') }
 } catch { /**/ }
 }, 5000)
 return () => clearInterval(id)
 }, [info?.ultimoPagamento?.status, router])

 async function gerarPagamento(tipo: 'pix' | 'cartao') {
 setGerando(true); setMsg('')
 const res = await fetch('/api/consultor/assinar-pro', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ tipo }),
 })
 const data = await res.json()
 if (data.ok) {
 setInfo(prev => prev ? { ...prev, ultimoPagamento: data.pagamento } : prev)
 if (data.tipo === 'cartao' && data.paymentUrl) {
 window.open(data.paymentUrl, '_blank')
 }
 } else {
 setMsg(data.error || 'Erro ao gerar cobrança.')
 }
 setGerando(false)
 }

 function copiarPix() {
 const pix = info?.ultimoPagamento?.pix_copia_cola
 if (!pix) return
 navigator.clipboard.writeText(pix)
 setCopiado(true)
 setTimeout(() => setCopiado(false), 3000)
 }

 const pag = info?.ultimoPagamento
 const qrSrc = pag?.qrcode_base64
 ? `data:image/png;base64,${pag.qrcode_base64.replace('data:image/png;base64,', '')}`
 : pag?.pix_copia_cola
 ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pag.pix_copia_cola)}&color=6366f1&bgcolor=ffffff`
 : null

 const valorMensal = info?.valorPlano ?? 97
 const valorAnual = info?.valorAnual ?? Math.round(valorMensal * 12 * 0.824)
 const valorCartaoMensal = Math.round((valorAnual / 12) * 100) / 100
 const nomeSite = info?.nomeSite || 'Universidade'
 const nomePro = `${nomeSite} PRO`
 const temPagamentoPendente = pag?.status === 'pendente'
 const tipoPendente = pag?.tipo || 'pix'

 return (
 <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f0f1f5', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
 <div style={{ width: '100%', maxWidth: 520 }}>

 {/* Header */}
 <div style={{ textAlign: 'center', marginBottom: 32 }}>
 <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 100, padding: '6px 20px', fontSize: 13, fontWeight: 800, color: '#818cf8', marginBottom: 20 }}>
 {nomePro}
 </div>
 <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Faça o upgrade agora</h1>
 <p style={{ color: '#8a8fa3', fontSize: 15 }}>Acesso completo + gestão de equipe ilimitada</p>
 </div>

 {/* Já é PRO */}
 {info?.jaEhPro && (
 <div style={{ background: 'rgba(2,161,83,0.1)', border: '1px solid #02A153', borderRadius: 14, padding: '24px', textAlign: 'center' }}>
 <CheckCircle size={40} style={{ color: '#22c55e', margin: '0 auto 8px', display: 'block' }} />
 <p style={{ fontWeight: 800, fontSize: 18, color: '#22c55e', marginBottom: 8 }}>Você já é {nomePro}!</p>
 <a href="/pro" style={{ display: 'inline-block', background: '#22c55e', color: '#fff', borderRadius: 10, padding: '12px 28px', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
 → Acessar painel PRO
 </a>
 </div>
 )}

 {!info?.jaEhPro && (
 <>
 {/* ── SELEÇÃO DE PLANO ─────────────────────────────── */}
 {!temPagamentoPendente && (
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>

 {/* PIX Mensal */}
 <button
 onClick={() => setOpcao('pix')}
 style={{
 background: opcao === 'pix' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
 border: `2px solid ${opcao === 'pix' ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
 borderRadius: 14, padding: '20px 16px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
 }}>
 <Zap size={24} style={{ color: '#6366f1', marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
 <p style={{ color: '#818cf8', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>PIX Mensal</p>
 <p style={{ fontWeight: 900, fontSize: 26, color: '#fff', lineHeight: 1, marginBottom: 2 }}>
 R$ {valorMensal.toFixed(2).replace('.', ',')}
 </p>
 <p style={{ color: '#8a8fa3', fontSize: 11 }}>/mês · renovação mensal</p>
 </button>

 {/* Cartão Anual */}
 <button
 onClick={() => setOpcao('cartao')}
 style={{
 background: opcao === 'cartao' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
 border: `2px solid ${opcao === 'cartao' ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
 borderRadius: 14, padding: '20px 16px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s', position: 'relative',
 }}>
 <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#22c55e', color: '#000', fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 100, whiteSpace: 'nowrap' }}>
 MELHOR OFERTA
 </div>
 <CreditCard size={24} style={{ color: '#22c55e', marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
 <p style={{ color: '#22c55e', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Cartão Anual</p>
 <p style={{ fontWeight: 900, fontSize: 26, color: '#fff', lineHeight: 1, marginBottom: 2 }}>
 R$ {valorCartaoMensal.toFixed(2).replace('.', ',')}
 </p>
 <p style={{ color: '#8a8fa3', fontSize: 11 }}>12x · {(12 * valorCartaoMensal).toFixed(2).replace('.', ',')} total</p>
 </button>
 </div>
 )}

 {/* Card de benefícios */}
 {!temPagamentoPendente && (
 <div style={{ background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
 {['Módulos ilimitados', 'Equipe ilimitada', 'Links de captação', 'Relatórios da equipe', 'WhatsApp direto', 'Templates de arte', 'Indicações ilimitadas', 'Certificados'].map(item => (
 <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#c4b5fd' }}>
 <span style={{ color: '#6366f1', fontSize: 14 }}>✓</span> {item}
 </div>
 ))}
 </div>
 </div>
 )}

 {/* ── PIX PENDENTE ───────────────────────────────── */}
 {temPagamentoPendente && tipoPendente === 'pix' && (
 <div style={{ background: '#181b24', border: '1px solid #252836', borderRadius: 14, padding: '24px', textAlign: 'center' }}>
 <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
 <QrCode size={16} style={{ opacity: 0.7, flexShrink: 0 }} />Pague via PIX e ative agora
 </p>
 <p style={{ color: '#8a8fa3', fontSize: 13, marginBottom: 20 }}>
 Vence em: {pag!.vencimento ? new Date(pag!.vencimento + 'T12:00:00').toLocaleDateString('pt-BR') : ''}
 </p>
 {qrSrc && (
 <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
 <div style={{ padding: 12, border: '3px solid #6366f1', borderRadius: 14, background: '#fff' }}>
 <img src={qrSrc} width={180} height={180} alt="QR Code PIX" style={{ display: 'block' }} />
 </div>
 </div>
 )}
 <button onClick={copiarPix} className={`btn btn-full ${copiado ? 'btn-green' : 'btn-primary'}`} style={{ marginBottom: 12, fontSize: 15 }}>
 {copiado ? 'PIX copiado!' : 'Copiar PIX Copia e Cola'}
 </button>
 <div style={{ background: 'rgba(2,161,83,0.08)', border: '1px solid rgba(2,161,83,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#6ee7b7', lineHeight: 1.6 }}>
 Verificando automaticamente... O acesso PRO abre sozinho quando o PIX for confirmado.
 </div>
 </div>
 )}

 {/* ── CARTÃO PENDENTE ────────────────────────────── */}
 {temPagamentoPendente && tipoPendente === 'cartao' && (
 <div style={{ background: '#181b24', border: '1px solid #252836', borderRadius: 14, padding: '24px', textAlign: 'center' }}>
 <CreditCard size={40} style={{ color: '#22c55e', display: 'block', margin: '0 auto 12px' }} />
 <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Pagamento via cartão em andamento</p>
 <p style={{ color: '#8a8fa3', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
 Clique no botão abaixo para acessar a página de pagamento da Efí Bank.<br />
 Após pagar, o acesso PRO anual é liberado automaticamente.
 </p>
 {pag!.payment_url && (
 <a href={pag!.payment_url} target="_blank" rel="noopener noreferrer"
 className="btn btn-green btn-full" style={{ fontSize: 15, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
 <ExternalLink size={16} />
 Ir para pagamento → Efí Bank
 </a>
 )}
 <div style={{ background: 'rgba(2,161,83,0.08)', border: '1px solid rgba(2,161,83,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#6ee7b7', lineHeight: 1.6 }}>
 Verificando confirmação do cartão... Assim que pago, o acesso PRO anual abre sozinho.
 </div>
 </div>
 )}

 {/* ── BOTÃO DE AÇÃO ──────────────────────────────── */}
 {!temPagamentoPendente && opcao && (
 <div style={{ background: '#181b24', border: '1px solid #252836', borderRadius: 14, padding: '20px 24px' }}>
 {opcao === 'pix' && (
 <>
 <p style={{ color: '#8a8fa3', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
 Gera um QR Code PIX. Pague e o acesso PRO mensal é liberado na hora.
 </p>
 <button onClick={() => gerarPagamento('pix')} disabled={gerando} className="btn btn-primary btn-full btn-lg" style={{ fontSize: 16 }}>
 {gerando ? 'Gerando PIX...' : `Gerar PIX — R$ ${valorMensal.toFixed(2).replace('.', ',')}/mês`}
 </button>
 </>
 )}
 {opcao === 'cartao' && (
 <>
 <p style={{ color: '#8a8fa3', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
 Você será redirecionado para a página segura da Efí Bank para inserir os dados do cartão em 12x.
 </p>
 <button onClick={() => gerarPagamento('cartao')} disabled={gerando} className="btn btn-green btn-full btn-lg" style={{ fontSize: 16 }}>
 {gerando ? 'Gerando link...' : `Pagar 12x R$ ${valorCartaoMensal.toFixed(2).replace('.', ',')} no cartão`}
 </button>
 <p style={{ color: '#8a8fa3', fontSize: 11, marginTop: 10, textAlign: 'center' }}>
 Total: R$ {valorAnual.toFixed(2).replace('.', ',')} · 1 ano de acesso PRO
 </p>
 </>
 )}
 {msg && <p style={{ color: '#f87171', fontSize: 13, marginTop: 10, textAlign: 'center' }}>{msg}</p>}
 </div>
 )}

 {!temPagamentoPendente && !opcao && (
 <p style={{ textAlign: 'center', color: '#8a8fa3', fontSize: 13 }}>
 Selecione uma forma de pagamento acima para continuar.
 </p>
 )}

 <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#8a8fa3' }}>
 Pagamento 100% seguro · Efí Bank
 </p>
 </>
 )}

 <div style={{ textAlign: 'center', marginTop: 20 }}>
 <a href="/consultor/upgrade" style={{ color: '#8a8fa3', fontSize: 13, textDecoration: 'none' }}>← Voltar</a>
 </div>
 </div>
 </div>
 )
}
