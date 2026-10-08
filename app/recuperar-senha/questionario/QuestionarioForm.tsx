'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PhoneInput from '@/app/components/PhoneInput'

export default function QuestionarioForm({ logoUrl, siteNome }: { logoUrl: string; siteNome: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!email || !telefone) { setErro('Preencha e-mail e telefone.'); return }
    if (senha.length < 6) { setErro('A nova senha deve ter pelo menos 6 caracteres.'); return }
    if (senha !== confirmar) { setErro('As senhas não coincidem.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/recuperar-questionario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, telefone, novaSenha: senha }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setSucesso(true)
        setTimeout(() => router.push('/login'), 2000)
      } else {
        setErro(data.error ?? 'Não foi possível redefinir a senha.')
      }
    } catch {
      setErro('Erro de conexão. Verifique sua internet.')
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', background: 'rgba(8,9,13,0.8)', border: '1px solid var(--avp-border)',
    borderRadius: 8, padding: '12px 14px', color: 'var(--avp-text)', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    display: 'block', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600,
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1,
  }

  const Eye = ({ v }: { v: boolean }) => v
    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {logoUrl && (
            <img src={logoUrl} className="logo-site" alt="Logo"
              style={{ height: 72, objectFit: 'contain', marginBottom: 14 }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          )}
          {siteNome && <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: 2, textTransform: 'uppercase' }}>{siteNome}</h1>}
        </div>

        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32 }}>
          {sucesso ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Senha redefinida!</h2>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Redirecionando para o login...</p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Recuperar senha</h2>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
                Confirme o <strong style={{ color: 'var(--avp-text)' }}>e-mail</strong> e o <strong style={{ color: 'var(--avp-text)' }}>telefone</strong> do seu cadastro e crie uma nova senha, sem sair do app.
              </p>

              {erro && (
                <div style={{ background: '#e6394620', border: '1px solid #e63946', borderRadius: 8, padding: '10px 14px', color: '#e63946', fontSize: 14, marginBottom: 16 }}>
                  {erro}
                </div>
              )}

              <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={lbl}>E-mail do cadastro</label>
                  <input type="email" placeholder="seu@email.com" value={email}
                    onChange={e => setEmail(e.target.value)} required style={inp} autoComplete="email" />
                </div>
                <div>
                  <label style={lbl}>Telefone do cadastro</label>
                  <PhoneInput value={telefone} onChange={setTelefone} required />
                </div>

                <div style={{ borderTop: '1px solid var(--avp-border)', paddingTop: 16, marginTop: 2 }}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={lbl}>Nova senha</label>
                    <div style={{ position: 'relative' }}>
                      <input type={verSenha ? 'text' : 'password'} placeholder="Mínimo 6 caracteres"
                        value={senha} onChange={e => setSenha(e.target.value)} required minLength={6}
                        style={{ ...inp, paddingRight: 44 }} autoComplete="new-password" />
                      <button type="button" onClick={() => setVerSenha(v => !v)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', display: 'flex' }}>
                        <Eye v={verSenha} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Confirmar nova senha</label>
                    <input type={verSenha ? 'text' : 'password'} placeholder="Repita a senha"
                      value={confirmar} onChange={e => setConfirmar(e.target.value)} required minLength={6}
                      style={inp} autoComplete="new-password" />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Verificando...' : 'Redefinir senha'}
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
