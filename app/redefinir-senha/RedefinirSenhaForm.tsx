'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function RedefinirSenhaForm({ logoUrl, siteNome }: { logoUrl: string; siteNome: string }) {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [trocandoCodigo, setTrocandoCodigo] = useState(true)
  const [erro, setErro] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [verConfirmar, setVerConfirmar] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Troca o ?code= da URL por uma sessão válida ao carregar a página
  useEffect(() => {
    async function trocarCodigo() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setErro('Link inválido ou expirado. Solicite um novo link de recuperação.')
        }
        // Remove o ?code= da URL sem recarregar a página
        window.history.replaceState({}, '', '/redefinir-senha')
      } else {
        // Sem code — verificar se já tem sessão ativa (token no hash, fluxo antigo)
        const hash = window.location.hash
        if (!hash.includes('access_token') && !hash.includes('type=recovery')) {
          setErro('Link inválido ou expirado. Solicite um novo link de recuperação.')
        }
      }
      setTrocandoCodigo(false)
    }
    trocarCodigo()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (senha !== confirmar) { setErro('As senhas não coincidem.'); return }
    if (senha.length < 6) { setErro('A senha precisa ter pelo menos 6 caracteres.'); return }
    setLoading(true)
    setErro('')

    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) {
      setErro('Erro ao redefinir senha. O link pode ter expirado — solicite um novo.')
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
          {siteNome && (
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: 2, textTransform: 'uppercase' }}>{siteNome}</h1>
          )}
        </div>

        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32 }}>

          {trocandoCodigo ? (
            /* Carregando enquanto troca o code */
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Validando link...</p>
            </div>
          ) : erro && !loading ? (
            /* Link inválido / expirado */
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Link inválido</h2>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                {erro}
              </p>
              <a href="/recuperar-senha"
                style={{ display: 'block', background: 'var(--grad-brand)', color: '#fff', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 15, textDecoration: 'none', textAlign: 'center' }}>
                Solicitar novo link
              </a>
            </div>
          ) : (
            /* Formulário de nova senha */
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Nova senha</h2>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
                Crie uma nova senha para sua conta.
              </p>
              {erro && (
                <div style={{ background: '#e6394620', border: '1px solid #e63946', borderRadius: 8, padding: '10px 14px', color: '#e63946', fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>
                  {erro}
                  {erro.includes('expirado') && (
                    <div style={{ marginTop: 8 }}>
                      <a href="/recuperar-senha" style={{ color: '#e63946', fontWeight: 700, textDecoration: 'underline' }}>
                        → Solicitar novo link
                      </a>
                    </div>
                  )}
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
                    <button type="button" onClick={() => setVerSenha(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', display: 'flex' }}>
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
                    <button type="button" onClick={() => setVerConfirmar(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', display: 'flex' }}>
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
            <a href="/login" style={{ color: 'var(--avp-green)', textDecoration: 'none', fontWeight: 600 }}>
              ← Voltar ao login
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
