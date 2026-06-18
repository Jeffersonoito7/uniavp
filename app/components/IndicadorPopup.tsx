'use client'
import { useState, useEffect } from 'react'
import PhoneInput from './PhoneInput'

type Props = {
  alunoId: string
  alunoWhatsapp: string
}

const STORAGE_KEY = 'indicador_popup_adiado'
const ADIADO_HORAS = 24

export default function IndicadorPopup({ alunoId, alunoWhatsapp }: Props) {
  const [visivel, setVisivel] = useState(false)
  const [wpp, setWpp] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [concluido, setConcluido] = useState(false)

  useEffect(() => {
    const adiado = localStorage.getItem(STORAGE_KEY)
    if (adiado) {
      const ts = parseInt(adiado)
      if (Date.now() - ts < ADIADO_HORAS * 60 * 60 * 1000) return
    }
    const t = setTimeout(() => setVisivel(true), 2000)
    return () => clearTimeout(t)
  }, [])

  function adiar() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
    setVisivel(false)
  }

  async function salvar() {
    setErro('')
    const digits = wpp.replace(/\D/g, '')
    if (digits.length < 10) {
      setErro('Informe um número de WhatsApp válido.')
      return
    }
    setSalvando(true)
    try {
      const res = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aluno_id: alunoId, indicador_whatsapp: digits }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error || 'Erro ao salvar.')
        return
      }
      setConcluido(true)
      localStorage.removeItem(STORAGE_KEY)
      setTimeout(() => setVisivel(false), 2200)
    } finally {
      setSalvando(false)
    }
  }

  if (!visivel) return null

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9100, padding: 20 }}
      onClick={e => e.target === e.currentTarget && adiar()}
    >
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 18, width: '100%', maxWidth: 460, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>

        {/* Topo colorido */}
        <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)', padding: '28px 28px 22px', position: 'relative' }}>
          <button
            onClick={adiar}
            style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.25)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >×</button>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🤝</div>
          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 900, margin: '0 0 6px', lineHeight: 1.2 }}>
            Alguém te indicou?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
            Informe o WhatsApp de quem te trouxe até aqui. Essa pessoa merece o reconhecimento pela indicação.
          </p>
        </div>

        {/* Corpo */}
        <div style={{ padding: '22px 28px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {concluido ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
              <p style={{ color: 'var(--avp-text)', fontWeight: 700, fontSize: 16, margin: 0 }}>Indicação registrada!</p>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 6 }}>Obrigado por reconhecer quem te indicou.</p>
            </div>
          ) : (
            <>
              <div>
                <label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  WhatsApp de quem te indicou
                </label>
                <PhoneInput
                  value={wpp}
                  onChange={setWpp}
                  placeholder="87 9 9999-9999"
                  disabled={salvando}
                />
              </div>

              {erro && (
                <p style={{ color: '#f87171', fontSize: 13, margin: 0, background: 'rgba(248,113,113,0.08)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.2)' }}>
                  {erro}
                </p>
              )}

              <button
                onClick={salvar}
                disabled={salvando}
                className="btn btn-primary btn-full"
                style={{ fontSize: 15, opacity: salvando ? 0.7 : 1 }}
              >
                {salvando ? 'Salvando...' : 'Registrar indicação'}
              </button>

              <button
                onClick={adiar}
                style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', padding: 0, textAlign: 'center' }}
              >
                Pular por agora
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
