'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function RedefinirSenhaForm({ logoUrl, siteNome }: { logoUrl: string; siteNome: string }) {
  const router = useRouter()
  const [pronto, setPronto] = useState(false)
  const [erro, setErro] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [verSenha, setVerSenha] = useState(false)
  const [verConfirmar, setVerConfirmar] = useState(false)
  const done = useRef(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // 1. Ouve mudanças de auth — Supabase processa ?code= e #access_token automaticamente
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (done.current) return
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        done.current = true
        window.history.replaceState({}, '', '/redefinir-senha')
        setPronto(true)
        subscription.unsubscribe()
      }
    })

    // 2. Timeout de 8s — se nada aconteceu, link é inválido/expirado
    const timeout = setTimeout(() => {
      if (done.current) return
      done.current = true
      subscription.unsubscribe()
      setErro('Link inválido ou expirado. Solicite um novo.')
      setPronto(true)
    }, 8000)

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (senha !== confirmar) { setErro('As senhas não coincidem.'); return }
    if (senha.length < 6) { setErro('A senha precisa ter pelo menos 6 caracteres.'); return }
    setLoading(true)
    setErro('')
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) {
      setErro('Erro ao salvar. Solicite um novo link de recuperação.')
      setLoading(false)
      return
    }
    await supabase.auth.signOut()
    router.push('/login?msg=senha-redefinida')
  }

  const inp: React.CSSProperties = {
    width: '100%', background: 'rgba(8,9,13,0.8)', border: '1px solid var(--avp-border)',
    borderRadius: 8, padding: '12px 14px', color: 'var(--avp-text)', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  }
  const eyeBtn: React.CSSProperties = {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', display: 'flex',
  }
  const EyeOpen = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  const EyeClosed = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {logoUrl && (
            <img src={logoUrl} className="logo-site" alt="Logo"
              style={{ height: 72, objectFit: 'contain', marginBottom: 14 }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          )}
          {siteNome && <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: 2, textTransform: 'uppercase' }}>{siteNome}</h1>}
        </div>

        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32 }}>

          {/* Aguardando sessão */}
          {!pronto && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Validando seu link...</p>
            </div>
          )}

          {/* Link inválido */}
          {pronto && erro && !loading && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Link inválido ou expirado</h2>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                Este link já foi usado ou expirou.<br />Solicite um novo link para continuar.
              </p>
              <a href="/recuperar-senha"
                style={{ display: 'block', background: 'var(--grad-brand)', color: '#fff', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 15, textDecoration: 'none', textAlign: 'center' }}>
                Solicitar novo link
              </a>
            </div>
          )}

          {/* Formulário de nova senha */}
          {pronto && !erro && (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Nova senha</h2>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
                Crie uma nova senha para sua conta.
              </p>
              {erro && (
                <div style={{ background: '#e6394620', border: '1px solid #e63946', borderRadius: 8, padding: '10px 14px', color: '#e63946', fontSize: 14, marginBottom: 16 }}>
                  {erro}
                </div>
              )}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>
                    Nova senha
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input type={verSenha ? 'text' : 'password'} placeholder="Mínimo 6 caracteres"
                      value={senha} onChange={e => setSenha(e.target.value)} required minLength={6}
                      style={{ ...inp, paddingRight: 44 }} />
                    <button type="button" onClick={() => setVerSenha(v => !v)} style={eyeBtn}>
                      {verSenha ? <EyeOpen /> : <EyeClosed />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>
                    Confirmar senha
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input type={verConfirmar ? 'text' : 'password'} placeholder="Repita a senha"
                      value={confirmar} onChange={e => setConfirmar(e.target.value)} required minLength={6}
                      style={{ ...inp, paddingRight: 44 }} />
                    <button type="button" onClick={() => setVerConfirmar(v => !v)} style={eyeBtn}>
                      {verConfirmar ? <EyeOpen /> : <EyeClosed />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Salvando...' : 'Redefinir senha'}
                </button>
              </form>
            </>
          )}

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--avp-text-dim)' }}>
            <a href="/login" style={{ color: 'var(--avp-green)', textDecoration: 'none', fontWeight: 600 }}>← Voltar ao login</a>
          </p>
        </div>
      </div>
    </div>
  )
}
