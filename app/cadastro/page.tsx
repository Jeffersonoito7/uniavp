'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SiteLogoHeader from '@/app/components/SiteLogoHeader'
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

export default function CadastroPage() {
 const router = useRouter()
 const [form, setForm] = useState({
 nome: '',
 whatsapp: '',
 email: '',
 cpf: '',
 senha: '',
 gestor_nome: '',
 gestor_whatsapp: '',
 })
 const [loading, setLoading] = useState(false)
 const [erro, setErro] = useState('')
 const [sucesso, setSucesso] = useState('')
 const [verSenha, setVerSenha] = useState(false)

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 setErro('')
 setSucesso('')
 const cpfLimpo = form.cpf.replace(/\D/g, '')
 if (!cpfLimpo || cpfLimpo.length !== 11) {
 setErro('CPF é obrigatório. Preencha todos os 11 dígitos.')
 return
 }
 if (!validarCPF(form.cpf)) {
 setErro('CPF inválido. Verifique os números e tente novamente.')
 return
 }
 setLoading(true)
 const res = await fetch('/api/cadastro', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 nome: form.nome,
 whatsapp: form.whatsapp.replace(/\D/g, ''),
 email: form.email,
 cpf: form.cpf.replace(/\D/g, '') || null,
 senha: form.senha,
 gestor_nome: form.gestor_nome,
 gestor_whatsapp: form.gestor_whatsapp.replace(/\D/g, ''),
 }),
 })
 const data = await res.json()
 if (data.aluno) {
 setSucesso('Conta criada com sucesso!')
 setTimeout(() => router.push('/login'), 1500)
 } else {
 setErro(data.erro ?? data.error ?? 'Erro ao criar conta.')
 }
 setLoading(false)
 }

 const inputStyle: React.CSSProperties = {
 width: '100%',
 background: 'var(--avp-black)',
 border: '1px solid var(--avp-border)',
 borderRadius: 8,
 padding: '12px 14px',
 color: 'var(--avp-text)',
 fontSize: 14,
 outline: 'none',
 boxSizing: 'border-box',
 }
 const labelStyle: React.CSSProperties = {
 display: 'block',
 color: 'var(--avp-text-dim)',
 fontSize: 13,
 marginBottom: 6,
 fontWeight: 500,
 }

 return (
 <div style={{ minHeight: '100vh', background: 'var(--avp-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '32px 16px' }}>
 <div style={{ width: 440, maxWidth: '100%' }}>
 <div style={{ textAlign: 'center', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
 <SiteLogoHeader height={72} />
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, margin: 0 }}>Crie sua conta para iniciar a formação</p>
 </div>
 <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32 }}>
 {erro && (
 <div style={{ background: '#e6394620', border: '1px solid #e63946', borderRadius: 8, padding: '10px 14px', color: '#e63946', fontSize: 14, marginBottom: 16 }}>
 {erro}
 </div>
 )}
 {sucesso && (
 <div style={{ background: '#02A15320', border: '1px solid var(--avp-green)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-green)', fontSize: 14, marginBottom: 16 }}>
 {sucesso}
 </div>
 )}
 <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
 <div>
 <label style={labelStyle}>Nome completo *</label>
 <input
 type="text"
 placeholder="Seu nome"
 value={form.nome}
 onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
 required
 style={inputStyle}
 />
 </div>
 <div>
 <label style={labelStyle}>WhatsApp *</label>
 <PhoneInput value={form.whatsapp} onChange={v => setForm(p => ({ ...p, whatsapp: v }))} required />
 </div>
 <div>
 <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
 CPF *
 {form.cpf.replace(/\D/g, '').length === 11 && (
 <span style={{ fontSize: 12, color: validarCPF(form.cpf) ? '#22c55e' : '#f87171', fontWeight: 700 }}>
 {validarCPF(form.cpf) ? ' válido' : ' inválido'}
 </span>
 )}
 </label>
 <input
 type="text"
 placeholder="000.000.000-00"
 value={form.cpf}
 onChange={e => setForm(p => ({ ...p, cpf: formatarCPF(e.target.value) }))}
 style={{
 ...inputStyle,
 borderColor: form.cpf.replace(/\D/g, '').length === 11 && !validarCPF(form.cpf)
 ? 'rgba(248,113,113,0.6)' : 'var(--avp-border)',
 }}
 />
 {form.cpf.replace(/\D/g, '').length === 11 && !validarCPF(form.cpf) && (
 <p style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>CPF inválido — verifique os números</p>
 )}
 </div>
 <div>
 <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
 E-mail *
 {form.email.length> 4 && (
 <span style={{ fontSize: 12, color: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? '#22c55e' : '#f87171', fontWeight: 700 }}>
 {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? ' válido' : ' inválido'}
 </span>
 )}
 </label>
 <input
 type="email"
 placeholder="seu@email.com"
 value={form.email}
 onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
 required
 style={{
 ...inputStyle,
 borderColor: form.email.length> 4 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
 ? 'rgba(248,113,113,0.6)' : 'var(--avp-border)',
 }}
 />
 </div>
 <div>
 <label style={labelStyle}>Senha *</label>
 <div style={{ position: 'relative' }}>
 <input
 type={verSenha ? 'text' : 'password'}
 placeholder="Mínimo 6 caracteres"
 value={form.senha}
 onChange={e => setForm(p => ({ ...p, senha: e.target.value }))}
 required minLength={6}
 style={{ ...inputStyle, paddingRight: 44 }}
 />
 <button type="button" onClick={() => setVerSenha(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', padding: 0, display: 'flex' }}>
 {verSenha
 ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
 : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
 }
 </button>
 </div>
 </div>
 <div style={{ borderTop: '1px solid var(--avp-border)', paddingTop: 16, marginTop: 4 }}>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, marginBottom: 14 }}>Quem te indicou? <span style={{ opacity: 0.6 }}>(opcional)</span></p>
 <PhoneInput value={form.gestor_whatsapp} onChange={v => setForm(p => ({ ...p, gestor_whatsapp: v }))} placeholder="WhatsApp de quem te indicou" />
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 6 }}>Se alguém te indicou, informe o WhatsApp dessa pessoa</p>
 </div>
 <button
 type="submit"
 disabled={loading}
 style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '13px', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 4, opacity: loading ? 0.7 : 1 }}
>
 {loading ? 'Criando conta...' : 'Criar conta'}
 </button>
 </form>
 <p style={{ textAlign: 'center', color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 20 }}>
 Já tem conta?{' '}
 <a href="/login" style={{ color: 'var(--avp-green)', textDecoration: 'none', fontWeight: 600 }}>Entrar</a>
 </p>
 </div>
 </div>
 </div>
 )
}
