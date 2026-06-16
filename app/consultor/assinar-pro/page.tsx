'use client'
import { useEffect, useState } from 'react'
import { QrCode, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Info = {
 jaEhPro: boolean
 valorPlano: number
 nomeSite?: string
 ultimoPagamento: { pix_copia_cola: string; qrcode_base64: string; vencimento: string; status: string } | null
}

export default function AssinarProPage() {
 const [info, setInfo] = useState<Info | null>(null)
 const [gerando, setGerando] = useState(false)
 const [copiado, setCopiado] = useState(false)
 const [msg, setMsg] = useState('')
 const router = useRouter()

 useEffect(() => {
 fetch('/api/consultor/assinar-pro').then(r => r.json()).then(setInfo)
 }, [])

 // Polling: detecta confirmação do PIX e redireciona automaticamente
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

 async function gerarPix() {
 setGerando(true); setMsg('')
 const res = await fetch('/api/consultor/assinar-pro', { method: 'POST' })
 const data = await res.json()
 if (data.ok) {
 setInfo(prev => prev ? { ...prev, ultimoPagamento: data.pagamento } : prev)
 } else {
 setMsg(data.error || 'Erro ao gerar cobrança.')
 }
 setGerando(false)
 }

 function copiarPix() {
 if (!info?.ultimoPagamento?.pix_copia_cola) return
 navigator.clipboard.writeText(info.ultimoPagamento.pix_copia_cola)
 setCopiado(true)
 setTimeout(() => setCopiado(false), 3000)
 }

 const pag = info?.ultimoPagamento
 const qrSrc = pag?.qrcode_base64
 ? `data:image/png;base64,${pag.qrcode_base64.replace('data:image/png;base64,', '')}`
 : pag?.pix_copia_cola
 ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pag.pix_copia_cola)}&color=6366f1&bgcolor=ffffff`
 : null

 const valor = info?.valorPlano ?? 97
 const nomeSite = info?.nomeSite || 'Universidade'
 const nomePro = `${nomeSite} PRO`
 const temPixPendente = pag?.status === 'pendente'

 return (
 <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f0f1f5', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
 <div style={{ width: '100%', maxWidth: 500 }}>

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
 {/* Card do plano */}
 <div style={{ background: 'rgba(79,70,229,0.08)', border: '2px solid rgba(79,70,229,0.3)', borderRadius: 16, padding: '28px', marginBottom: 20 }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
 <div>
 <p style={{ fontWeight: 800, fontSize: 20 }}>Plano PRO</p>
 <p style={{ color: '#8a8fa3', fontSize: 13, marginTop: 2 }}>Mensal · cancele quando quiser</p>
 </div>
 <div style={{ textAlign: 'right' }}>
 <p style={{ fontWeight: 900, fontSize: 36, color: '#818cf8', lineHeight: 1 }}>
 R$ {valor.toFixed(2).replace('.', ',')}
 </p>
 <p style={{ color: '#8a8fa3', fontSize: 12 }}>/mês</p>
 </div>
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
 {[
 'Módulos ilimitados', 'Equipe ilimitada',
 'Links de captação', 'Relatórios da equipe',
 'WhatsApp direto', 'Templates de arte',
 'Indicações ilimitadas', 'Certificados',
 ].map(item => (
 <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#c4b5fd' }}>
 {item}
 </div>
 ))}
 </div>
 </div>

 {/* PIX pendente */}
 {temPixPendente ? (
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
 Verificando pagamento automaticamente... Assim que confirmado, o acesso PRO abre sozinho.
 </div>
 </div>
 ) : (
 /* Botão direto para gerar PIX */
 <div style={{ background: '#181b24', border: '1px solid #252836', borderRadius: 14, padding: '24px' }}>
 <button onClick={gerarPix} disabled={gerando} className="btn btn-primary btn-full btn-lg" style={{ fontSize: 18 }}>
 {gerando ? 'Gerando PIX...' : `Assinar ${nomePro} — R$ ${valor.toFixed(2).replace('.', ',')} /mês`}
 </button>
 {msg && <p style={{ color: '#f87171', fontSize: 13, marginTop: 10, textAlign: 'center' }}>{msg}</p>}
 </div>
 )}

 <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#8a8fa3' }}>
 Pagamento 100% seguro via PIX · Efí Bank
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
