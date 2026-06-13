'use client'
import { useState, useEffect } from 'react'
import type { PlanoSaaS } from '@/app/api/super/planos/route'

export default function SignupForm({ planos, planoInicial }: { planos: PlanoSaaS[]; planoInicial?: string }) {
 const [etapa, setEtapa] = useState<'plano' | 'dados' | 'pix' | 'aguardando' | 'sucesso'>(planoInicial ? 'dados' : 'plano')
 const [planoId, setPlanoId] = useState(planoInicial || '')
 const [form, setForm] = useState({ nome_empresa: '', contato_nome: '', whatsapp: '', email: '', dominio: '' })
 const [loading, setLoading] = useState(false)
 const [erro, setErro] = useState('')
 const [pixData, setPixData] = useState<{ pix_copia_cola: string; qrcode_base64: string; valor: number; plano_nome: string; cliente_id: string } | null>(null)
 const [copiado, setCopiado] = useState(false)

 const plano = planos.find(p => p.id === planoId)

 useEffect(() => {
 if (etapa !== 'aguardando' || !pixData?.cliente_id) return
 const interval = setInterval(async () => {
 const res = await fetch(`/api/super/signup?cliente_id=${pixData.cliente_id}`)
 const data = await res.json()
 if (data.ativo) { setEtapa('sucesso'); clearInterval(interval) }
 }, 4000)
 return () => clearInterval(interval)
 }, [etapa, pixData])

 async function handleSubmit() {
 if (!planoId) { setErro('Selecione um plano.'); return }
 if (!form.nome_empresa || !form.contato_nome || !form.whatsapp || !form.email) {
 setErro('Preencha todos os campos obrigatórios.'); return
 }
 setLoading(true); setErro('')
 const res = await fetch('/api/super/signup', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ ...form, plano_id: planoId }),
 })
 const data = await res.json()
 setLoading(false)
 if (!res.ok) {
 setErro(data.error || 'Erro ao processar. Tente novamente.')
 return
 }
 setPixData({ pix_copia_cola: data.pix_copia_cola, qrcode_base64: data.qrcode_base64, valor: data.valor, plano_nome: data.plano_nome, cliente_id: data.cliente_id })
 setEtapa('pix')
 }

 function copiar() {
 if (!pixData) return
 navigator.clipboard.writeText(pixData.pix_copia_cola)
 setCopiado(true)
 setTimeout(() => setCopiado(false), 2500)
 }

 const S = {
 page: { minHeight: '100vh', background: '#0a0a0f', color: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' } as React.CSSProperties,
 card: { background: '#0f0f17', border: '1px solid #1e1f2e', borderRadius: 12 } as React.CSSProperties,
 inp: { width: '100%', background: '#080810', border: '1px solid #1e1f2e', borderRadius: 8, padding: '11px 14px', color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.15s' },
 lbl: { display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 6, letterSpacing: '0.02em', textTransform: 'uppercase' as const },
 btn: { background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '13px 28px', fontWeight: 600, fontSize: 14, cursor: 'pointer', letterSpacing: '0.01em' } as React.CSSProperties,
 btnGhost: { background: 'none', border: '1px solid #1e1f2e', color: '#64748b', borderRadius: 8, padding: '12px 20px', fontWeight: 500, fontSize: 14, cursor: 'pointer' } as React.CSSProperties,
 }

 const CheckIcon = () => (
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
 <polyline points="20 6 9 17 4 12" />
 </svg>
 )

 return (
 <div style={S.page}>
 <a href="/landing" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', marginBottom: 48, display: 'flex', alignItems: 'center', gap: 6 }}>
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <polyline points="15 18 9 12 15 6" />
 </svg>
 Voltar ao início
 </a>

 {/* Etapa: Escolher plano */}
 {etapa === 'plano' && (
 <div style={{ width: '100%', maxWidth: 900 }}>
 <h1 style={{ fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 6, letterSpacing: '-0.02em' }}>Escolha seu plano</h1>
 <p style={{ color: '#64748b', textAlign: 'center', marginBottom: 40, fontSize: 15 }}>Suporte incluso. Plataforma ativa em menos de 24 horas.</p>

 <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(planos.length, 3)}, 1fr)`, gap: 16, marginBottom: 28 }}>
 {planos.map(p => (
 <div key={p.id} onClick={() => { setPlanoId(p.id); setErro('') }} style={{
 ...S.card,
 padding: '24px 20px',
 cursor: 'pointer',
 position: 'relative',
 border: planoId === p.id ? '1.5px solid #4f46e5' : '1px solid #1e1f2e',
 background: planoId === p.id ? '#0d0d1f' : '#0f0f17',
 transition: 'border-color 0.15s, background 0.15s',
 }}>
 {p.destaque && (
 <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: '#4f46e5', color: '#fff', borderRadius: 20, padding: '2px 12px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
 MAIS POPULAR
 </div>
 )}
 <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: '#f1f5f9' }}>{p.nome}</h3>
 <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16, lineHeight: 1.5 }}>{p.descricao}</p>
 <p style={{ fontSize: 26, fontWeight: 700, marginBottom: 20, color: planoId === p.id ? '#818cf8' : '#f1f5f9', letterSpacing: '-0.02em' }}>
 {p.preco> 0 ? (
 <>{`R$ ${p.preco.toLocaleString('pt-BR')}`}<span style={{ fontSize: 14, fontWeight: 400, color: '#64748b' }}>/mês</span></>
 ) : (p.preco_label || 'Sob consulta')}
 </p>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
 {p.recursos.map(r => (
 <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
 <CheckIcon />
 <span style={{ fontSize: 13, color: '#94a3b8' }}>{r}</span>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>

 {erro && <p style={{ color: '#ef4444', textAlign: 'center', fontSize: 13, marginBottom: 16 }}>{erro}</p>}

 <div style={{ textAlign: 'center' }}>
 <button onClick={() => { if (!planoId) { setErro('Selecione um plano.'); return }; setErro(''); setEtapa('dados') }} style={S.btn}>
 Continuar
 </button>
 </div>
 </div>
 )}

 {/* Etapa: Dados */}
 {etapa === 'dados' && (
 <div style={{ width: '100%', maxWidth: 500 }}>
 <div style={{ textAlign: 'center', marginBottom: 32 }}>
 <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.02em' }}>Dados da organização</h1>
 {plano && (
 <span style={{ display: 'inline-block', background: '#0d0d1f', border: '1px solid #1e1f2e', borderRadius: 20, padding: '3px 14px', fontSize: 12, color: '#818cf8', fontWeight: 600 }}>
 Plano {plano.nome}
 </span>
 )}
 </div>

 <div style={{ ...S.card, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
 <div>
 <label style={S.lbl}>Nome da associação *</label>
 <input style={S.inp} placeholder="Associação dos Consultores XYZ" value={form.nome_empresa} onChange={e => setForm(p => ({ ...p, nome_empresa: e.target.value }))} />
 </div>
 <div>
 <label style={S.lbl}>Responsável *</label>
 <input style={S.inp} placeholder="Seu nome completo" value={form.contato_nome} onChange={e => setForm(p => ({ ...p, contato_nome: e.target.value }))} />
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
 <div>
 <label style={S.lbl}>WhatsApp *</label>
 <input style={S.inp} placeholder="(11) 99999-9999" value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} />
 </div>
 <div>
 <label style={S.lbl}>E-mail *</label>
 <input style={S.inp} type="email" placeholder="seu@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
 </div>
 </div>
 <div>
 <label style={S.lbl}>Domínio personalizado <span style={{ fontWeight: 400, textTransform: 'none', color: '#475569' }}>(opcional)</span></label>
 <input style={S.inp} placeholder="uni.suaassociacao.com.br" value={form.dominio} onChange={e => setForm(p => ({ ...p, dominio: e.target.value }))} />
 <p style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>Sem domínio próprio? Usamos um subdomínio padrão.</p>
 </div>

 {erro && (
 <div style={{ background: '#1a0a0a', border: '1px solid #3f1515', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: 13 }}>
 {erro}
 </div>
 )}

 <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
 {!planoInicial && (
 <button onClick={() => setEtapa('plano')} style={S.btnGhost}>
 Voltar
 </button>
 )}
 <button onClick={handleSubmit} disabled={loading} style={{ ...S.btn, flex: 1, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
 {loading ? 'Aguarde...' : 'Gerar PIX e continuar'}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Etapa: PIX */}
 {etapa === 'pix' && pixData && (
 <div style={{ width: '100%', maxWidth: 460, textAlign: 'center' }}>
 <div style={{ marginBottom: 8 }}>
 <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}>
 <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
 </svg>
 </div>
 <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em' }}>Pague para ativar</h1>
 <p style={{ color: '#64748b', marginBottom: 28, fontSize: 14 }}>
 Plano {pixData.plano_nome} · {pixData.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
 </p>

 {pixData.qrcode_base64 && (
 <div style={{ background: '#fff', borderRadius: 12, padding: 16, display: 'inline-block', marginBottom: 20 }}>
 <img src={`data:image/png;base64,${pixData.qrcode_base64}`} alt="QR Code PIX" style={{ width: 200, height: 200, display: 'block' }} />
 </div>
 )}

 <div style={{ ...S.card, padding: '16px 20px', marginBottom: 16, textAlign: 'left' }}>
 <p style={{ fontSize: 11, color: '#64748b', marginBottom: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>PIX Copia e Cola</p>
 <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#94a3b8', wordBreak: 'break-all', lineHeight: 1.6, marginBottom: 12 }}>
 {pixData.pix_copia_cola}
 </p>
 <button onClick={copiar} style={{
 background: copiado ? '#0a1f12' : '#0d0d1f',
 border: `1px solid ${copiado ? '#166534' : '#1e1f2e'}`,
 color: copiado ? '#4ade80' : '#818cf8',
 borderRadius: 7, padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%',
 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
 }}>
 {copiado ? (
 <>
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
 Copiado!
 </>
 ) : (
 <>
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
 Copiar código PIX
 </>
 )}
 </button>
 </div>

 <p style={{ color: '#64748b', fontSize: 12, marginBottom: 20, lineHeight: 1.6 }}>
 Após o pagamento, você receberá as credenciais de acesso no WhatsApp automaticamente.
 </p>

 <button onClick={() => setEtapa('aguardando')} style={{ ...S.btn, width: '100%' }}>
 Já paguei — verificar agora
 </button>
 </div>
 )}

 {/* Etapa: Aguardando */}
 {etapa === 'aguardando' && (
 <div style={{ textAlign: 'center', maxWidth: 380 }}>
 <div style={{ width: 56, height: 56, border: '3px solid #1e1f2e', borderTopColor: '#4f46e5', borderRadius: '50%', margin: '0 auto 28px', animation: 'spin 0.8s linear infinite' }} />
 <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
 <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.01em' }}>Verificando pagamento</h2>
 <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
 Assim que confirmarmos o pagamento, você receberá um WhatsApp com seus dados de acesso.
 </p>
 <button onClick={() => setEtapa('pix')} style={S.btnGhost}>
 Voltar ao PIX
 </button>
 </div>
 )}

 {/* Etapa: Sucesso */}
 {etapa === 'sucesso' && (
 <div style={{ textAlign: 'center', maxWidth: 460 }}>
 <div style={{ width: 56, height: 56, background: '#0a1f12', border: '1px solid #166534', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
 <polyline points="20 6 9 17 4 12" />
 </svg>
 </div>
 <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em' }}>Pagamento confirmado</h1>
 <p style={{ color: '#64748b', fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
 Sua plataforma está sendo configurada. Você receberá um WhatsApp em instantes com o link e as credenciais do painel admin.
 </p>
 <div style={{ ...S.card, padding: '20px 24px', textAlign: 'left' }}>
 <p style={{ fontSize: 12, fontWeight: 700, color: '#4ade80', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 14 }}>Próximos passos</p>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 {['Receba as credenciais no WhatsApp', 'Acesse seu painel admin', 'Configure logo, cores e conteúdo', 'Comece a cadastrar seus consultores'].map((s, i) => (
 <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
 <span style={{ width: 22, height: 22, background: '#0d0d1f', border: '1px solid #1e1f2e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#818cf8', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
 <span style={{ fontSize: 14, color: '#94a3b8' }}>{s}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}
 </div>
 )
}
