'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErro('')
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    if (error) { setErro('Erro ao enviar. Verifique o e-mail.'); setLoading(false); return }
    setEnviado(true)
    setLoading(false)
  }

  const inp: React.CSSProperties = { width: '100%', background: 'rgba(8,9,13,0.8)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '12px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/logo.png" alt="Logo AVP" style={{ height: 72, objectFit: 'contain', marginBottom: 14 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: 2, textTransform: 'uppercase' }}>UNIVERSIDADE AVP</h1>
        </div>
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32 }}>
          {!enviado ? (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Recuperar senha</h2>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>Digite seu e-mail e enviaremos um link para redefinir sua senha.</p>
              {erro && <div style={{ background: '#e6394620', border: '1px solid #e63946', borderRadius: 8, padding: '10px 14px', color: '#e63946', fontSize: 14, marginBottom: 16 }}>{erro}</div>}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>E-mail</label>
                  <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required style={inp} />
                </div>
                <button type="submit" disabled={loading} style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>E-mail enviado!</h2>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, lineHeight: 1.6 }}>Verifique sua caixa de entrada e clique no link para redefinir sua senha.</p>
            </div>
          )}
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--avp-text-dim)' }}>
            <a href="/login" style={{ color: 'var(--avp-green)', textDecoration: 'none', fontWeight: 600 }}>← Voltar ao login</a>
          </p>
        </div>
      </div>
    </div>
  )
}
