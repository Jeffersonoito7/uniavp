'use client'
import { useState } from 'react'

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

type Props = {
  alunoId?: string
  tipo: 'aluno' | 'gestor'
}

export default function CpfAlertPopup({ alunoId, tipo }: Props) {
  const [cpf, setCpf] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [concluido, setConcluido] = useState(false)
  const [dispensado, setDispensado] = useState(() => {
    if (typeof window === 'undefined') return false
    const em = localStorage.getItem(`cpf_dispensado_${tipo}`)
    if (!em) return false
    return em >= new Date().toISOString().slice(0, 10)
  })

  const cpfLimpo = cpf.replace(/\D/g, '')
  const cpfValido = validarCPF(cpf)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!cpfValido) {
      setErro('CPF inválido. Verifique os números.')
      return
    }
    setSalvando(true)
    try {
      const url = tipo === 'gestor' ? '/api/gestor/perfil' : '/api/perfil'
      const body = tipo === 'gestor'
        ? { cpf }
        : { aluno_id: alunoId, cpf }
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao salvar.')
        setSalvando(false)
        return
      }
      setConcluido(true)
      setTimeout(() => window.location.reload(), 1500)
    } catch {
      setErro('Erro de conexao. Tente novamente.')
      setSalvando(false)
    }
  }

  function dispensar() {
    localStorage.setItem(`cpf_dispensado_${tipo}`, new Date().toISOString().slice(0, 10))
    setDispensado(true)
  }

  if (concluido || dispensado) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#0f0f1a',
        border: '1px solid rgba(248,113,113,0.4)',
        borderRadius: 16,
        padding: '36px 32px',
        maxWidth: 420,
        width: '100%',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Icone de alerta */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56,
            borderRadius: '50%',
            background: 'rgba(248,113,113,0.12)',
            border: '1px solid rgba(248,113,113,0.3)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>CPF obrigatório</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
            Para continuar usando a plataforma e acessar sua carteira, informe seu CPF.
          </p>
        </div>

        <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              CPF *
              {cpfLimpo.length === 11 && (
                <span style={{ marginLeft: 8, color: cpfValido ? '#4ade80' : '#f87171', textTransform: 'none', fontWeight: 800 }}>
                  {cpfValido ? 'valido' : 'invalido'}
                </span>
              )}
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={e => setCpf(formatarCPF(e.target.value))}
              required
              autoFocus
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${cpfLimpo.length === 11 && !cpfValido ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 10,
                padding: '13px 16px',
                color: '#fff',
                fontSize: 16,
                outline: 'none',
                letterSpacing: '0.05em',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {erro && (
            <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{erro}</p>
          )}

          <button
            type="submit"
            disabled={salvando || !cpfValido}
            style={{
              background: cpfValido ? '#f59e0b' : 'rgba(255,255,255,0.08)',
              color: cpfValido ? '#000' : 'rgba(255,255,255,0.3)',
              border: 'none',
              borderRadius: 10,
              padding: '14px',
              fontWeight: 800,
              fontSize: 15,
              cursor: salvando || !cpfValido ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              marginTop: 4,
            }}
          >
            {salvando ? 'Salvando...' : concluido ? 'Salvo!' : 'Salvar CPF e continuar'}
          </button>

          <button
            type="button"
            onClick={dispensar}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.3)',
              fontSize: 13,
              cursor: 'pointer',
              padding: '8px 0 0',
              textAlign: 'center' as const,
              width: '100%',
            }}
          >
            Preencher depois
          </button>
        </form>
      </div>
    </div>
  )
}
