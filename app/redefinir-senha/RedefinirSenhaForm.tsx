'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

type Estado = 'validando' | 'formulario' | 'erro' | 'sucesso'

// Captura o hash ANTES de qualquer inicialização do Supabase
function lerHashErro(): string | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash
  if (!hash.includes('error=')) return null
  const params = new URLSearchParams(hash.slice(1))
  const code = params.get('error_code') ?? ''
  const desc = params.get('error_description') ?? ''
  window.history.replaceState({}, '', window.location.pathname + window.location.search)
  if (code === 'otp_expired' || desc.includes('expired') || desc.includes('invalid')) return 'expirado'
  return 'invalido'
}

const hashErroInicial = lerHashErro()

export default function RedefinirSenhaForm({ logoUrl, siteNome }: { logoUrl: string; siteNome: string }) {
  const router = useRouter()
  const [estado, setEstado] = useState<Estado>(hashErroInicial ? 'erro' : 'validando')
  const [msgErro, setMsgErro] = useState(hashErroInicial ?? '')
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
    // Se já detectamos erro no hash antes do Supabase inicializar, não faz nada
    if (hashErroInicial) return
    if (estado !== 'validando') return

    // Verificar se chegou com ?code= (PKCE flow)
    const searchParams = new URLSearchParams(window.location.search)
    const code = searchParams.get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (done.current) return
        done.current = true
        window.history.replaceState({}, '', '/redefinir-senha')
        if (error) {
          setMsgErro('expirado')
          setEstado('erro')
        } else {
          setEstado('formulario')
        }
      })
      return
    }

    // Aguardar evento PASSWORD_RECOVERY (implicit flow)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (done.current) return
      if (event === 'PASSWORD_RECOVERY') {
        done.current = true
        window.history.replaceState({}, '', '/redefinir-senha')
        setEstado('formulario')
        subscription.unsubscribe()
      }
    })

    // Timeout de 10s
    const timeout = setTimeout(() => {
      if (done.current) return
      done.current = true
      subscription.unsubscribe()
      setMsgErro('timeout')
      setEstado('erro')
    }, 10000)

    return () => { clearTimeout(timeout); subscription.unsubscribe() }
  }, [])

  async function salvarSenha(e: React.FormEvent) {
    e.preventDefault()
    if (senha !== confirmar) { alert('As senhas não coincidem.'); return }
    if (senha.length < 6) { alert('Mínimo 6 caracteres.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) {
      alert('Erro ao salvar. O link pode ter expirado — solicite um novo.')
      setLoading(false)
      return
    }
    await supabase.auth.signOut()
    setEstado('sucesso')
    setTimeout(() => router.push('/login'), 2000)
  }

  const inp: React.CSSProperties = {
    width: '100%', background: 'rgba(8,9,13,0.8)', border: '1px solid var(--avp-border)',
    borderRadius: 8, padding: '12px 14px', color: 'var(--avp-text)', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  }
  const Eye = ({ v }: { v: boolean }) => v
    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {logoUrl && <img src={logoUrl} alt="Logo" style={{ height: 72, objectFit: 'contain', marginBottom: 14 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />}
          {siteNome && <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: 2, textTransform: 'uppercase' }}>{siteNome}</h1>}
        </div>

        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32, textAlign: 'center' }}>

          {/* Validando */}
          {estado === 'validando' && (
            <>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 15, marginBottom: 8 }}>Validando seu link...</p>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>Aguarde alguns segundos</p>
            </>
          )}

          {/* Sucesso */}
          {estado === 'sucesso' && (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Senha redefinida!</h2>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Redirecionando para o login...</p>
            </>
          )}

          {/* Erro */}
          {estado === 'erro' && (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
                {msgErro === 'expirado' ? 'Link expirado' : msgErro === 'timeout' ? 'Navegador diferente' : 'Link inválido'}
              </h2>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                {msgErro === 'expirado'
                  ? 'Este link já foi usado ou expirou. Links de recuperação são de uso único — gere um novo.'
                  : msgErro === 'timeout'
                  ? 'O link precisa ser aberto no mesmo navegador onde foi gerado. Copie o link e cole neste navegador.'
                  : 'Link inválido ou já utilizado. Solicite um novo link de recuperação.'}
              </p>
              <a href="/recuperar-senha" style={{ display: 'block', background: 'var(--grad-brand)', color: '#fff', borderRadius: 10, padding: '13px', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
                Gerar novo link
              </a>
            </>
          )}

          {/* Formulário */}
          {estado === 'formulario' && (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, textAlign: 'center' }}>Nova senha</h2>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>Crie sua nova senha de acesso.</p>
              <form onSubmit={salvarSenha} style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Nova senha</label>
                  <div style={{ position: 'relative' }}>
                    <input type={verSenha ? 'text' : 'password'} placeholder="Mínimo 6 caracteres"
                      value={senha} onChange={e => setSenha(e.target.value)} required minLength={6}
                      style={{ ...inp, paddingRight: 44 }} />
                    <button type="button" onClick={() => setVerSenha(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', display: 'flex' }}>
                      <Eye v={verSenha} />
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Confirmar senha</label>
                  <div style={{ position: 'relative' }}>
                    <input type={verConfirmar ? 'text' : 'password'} placeholder="Repita a senha"
                      value={confirmar} onChange={e => setConfirmar(e.target.value)} required minLength={6}
                      style={{ ...inp, paddingRight: 44 }} />
                    <button type="button" onClick={() => setVerConfirmar(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', display: 'flex' }}>
                      <Eye v={verConfirmar} />
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
