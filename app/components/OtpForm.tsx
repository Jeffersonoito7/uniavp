'use client'
import { useState, useEffect, useRef } from 'react'

export default function OtpForm() {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [enviando, setEnviando] = useState(true)
  const [erro, setErro] = useState('')
  const [info, setInfo] = useState<{ canal: string; destino: string; codigoDev?: string } | null>(null)
  const [reenvioSegundos, setReenvioSegundos] = useState(60)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    enviarOtp()
  }, [])

  useEffect(() => {
    if (reenvioSegundos <= 0) return
    const t = setTimeout(() => setReenvioSegundos(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [reenvioSegundos])

  async function enviarOtp() {
    setEnviando(true)
    setErro('')
    const res = await fetch('/api/auth/enviar-otp', { method: 'POST' })
    const data = await res.json()
    if (data.ok) {
      setInfo(data)
      setReenvioSegundos(60)
    } else {
      setErro('Erro ao enviar código. Tente novamente.')
    }
    setEnviando(false)
    setTimeout(() => refs.current[0]?.focus(), 100)
  }

  function handleDigit(idx: number, val: string) {
    const cleaned = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[idx] = cleaned
    setDigits(next)
    if (cleaned && idx < 5) refs.current[idx + 1]?.focus()
    if (next.every(d => d !== '') && cleaned) {
      verificar(next.join(''))
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const txt = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (txt.length === 6) {
      setDigits(txt.split(''))
      verificar(txt)
    }
  }

  async function verificar(codigo: string) {
    setLoading(true)
    setErro('')
    const res = await fetch('/api/auth/verificar-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo })
    })
    const data = await res.json()
    if (data.ok && data.redirect) {
      window.location.href = data.redirect
    } else {
      setErro(data.error || 'Código incorreto.')
      setDigits(['', '', '', '', '', ''])
      setLoading(false)
      setTimeout(() => refs.current[0]?.focus(), 50)
    }
  }

  const inpStyle: React.CSSProperties = {
    width: 48, height: 60, textAlign: 'center', fontSize: 28, fontWeight: 800,
    background: 'rgba(30,58,138,0.6)', border: '2px solid rgba(59,130,246,0.4)',
    borderRadius: 10, color: '#fff', outline: 'none', caretColor: '#3b82f6',
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{ textAlign: 'center' }}>
      {enviando ? (
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>⏳ Enviando código...</p>
      ) : info ? (
        <div style={{ marginBottom: 24 }}>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.6 }}>
            Código enviado via <strong style={{ color: '#fff' }}>
              {info.canal === 'whatsapp' ? '📱 WhatsApp' : '✉️ e-mail'}
            </strong><br />
            para <strong style={{ color: '#60a5fa' }}>{info.destino}</strong>
          </p>
          {info.codigoDev && (
            <div style={{ background: '#f59e0b20', border: '1px solid #f59e0b50', borderRadius: 8, padding: '8px 16px', marginTop: 10, fontSize: 13, color: '#f59e0b' }}>
              🧪 Modo dev — código: <strong style={{ fontSize: 18, letterSpacing: 4 }}>{info.codigoDev}</strong>
            </div>
          )}
        </div>
      ) : null}

      {/* Inputs 6 dígitos */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }} onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => { refs.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            disabled={loading}
            onChange={e => handleDigit(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            style={{ ...inpStyle, borderColor: d ? 'rgba(59,130,246,0.8)' : 'rgba(59,130,246,0.4)', opacity: loading ? 0.7 : 1 }}
          />
        ))}
      </div>

      {loading && (
        <p style={{ color: '#60a5fa', fontSize: 14, marginBottom: 12 }}>✅ Verificando...</p>
      )}

      {erro && (
        <div style={{ background: '#ef444420', border: '1px solid #ef4444', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 14, marginBottom: 16 }}>
          {erro}
        </div>
      )}

      {/* Reenviar */}
      <div style={{ marginTop: 8 }}>
        {reenvioSegundos > 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            Reenviar código em {reenvioSegundos}s
          </p>
        ) : (
          <button onClick={enviarOtp} disabled={enviando}
            style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 14, fontWeight: 600, textDecoration: 'underline' }}>
            Reenviar código
          </button>
        )}
      </div>
    </div>
  )
}
