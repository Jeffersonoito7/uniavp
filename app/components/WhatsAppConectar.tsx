'use client'
import { useState, useEffect, useCallback } from 'react'

type Status = { conectado: boolean; instancia: string | null; numero: string | null; qrcode: string | null }

export default function WhatsAppConectar() {
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [polling, setPolling] = useState(false)

  const verificarStatus = useCallback(async () => {
    const res = await fetch('/api/whatsapp/status')
    const data = await res.json()
    // Preserva o qrcode se ainda estiver aguardando conexão
    setStatus(prev => (prev?.qrcode && !data.conectado) ? { ...data, qrcode: prev.qrcode ?? null } : data)
    return data
  }, [])

  useEffect(() => {
    verificarStatus()
  }, [verificarStatus])

  // Polling quando QR Code está ativo — verifica conexão a cada 3s
  // Não sobrescreve o qrcode para o QR não sumir durante a espera
  useEffect(() => {
    if (!polling) return
    const interval = setInterval(async () => {
      const res = await fetch('/api/whatsapp/status')
      const data = await res.json()
      setStatus(prev => ({ ...prev, conectado: data.conectado, numero: data.numero, instancia: data.instancia }))
      if (data.conectado) {
        setPolling(false)
        setMsg('✅ WhatsApp conectado com sucesso!')
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [polling])

  async function conectar() {
    setLoading(true)
    setMsg('')
    const res = await fetch('/api/whatsapp/conectar', { method: 'POST' })
    const data = await res.json()
    if (data.ok) {
      setStatus(s => ({ ...s!, qrcode: data.qrcode, conectado: false, instancia: data.instancia, numero: null }))
      setPolling(true)
      setMsg('Escaneie o QR Code com seu WhatsApp!')
    } else {
      setMsg(`Erro: ${data.error}`)
    }
    setLoading(false)
  }

  async function desconectar() {
    setLoading(true)
    await fetch('/api/whatsapp/desconectar', { method: 'POST' })
    setStatus({ conectado: false, instancia: null, numero: null, qrcode: null })
    setPolling(false)
    setMsg('WhatsApp desconectado.')
    setLoading(false)
  }

  if (!status) return <div style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Verificando...</div>

  return (
    <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 24 }}>💬</span>
        <div>
          <p style={{ fontWeight: 700, fontSize: 15 }}>WhatsApp para Notificações</p>
          <p style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>Conecte seu WhatsApp para enviar notificações automáticas</p>
        </div>
      </div>

      {status.conectado ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#02A15320', border: '1px solid var(--avp-green)', borderRadius: 8, padding: '10px 14px' }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <div>
              <p style={{ fontWeight: 700, color: 'var(--avp-green)', fontSize: 14 }}>WhatsApp Conectado</p>
              {status.numero && <p style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>Número: +55 {status.numero}</p>}
            </div>
          </div>
          <button onClick={desconectar} disabled={loading}
            style={{ background: 'var(--avp-danger)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, alignSelf: 'flex-start', opacity: loading ? 0.7 : 1 }}>
            Desconectar
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {status.qrcode ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <p style={{ fontSize: 14, color: 'var(--avp-text)', fontWeight: 600 }}>Escaneie com o WhatsApp da sua empresa:</p>
              <img src={status.qrcode} alt="QR Code WhatsApp"
                style={{ width: 220, height: 220, borderRadius: 12, border: '3px solid var(--avp-green)' }} />
              <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', textAlign: 'center' }}>
                Abra o WhatsApp → Menu → Dispositivos conectados → Conectar dispositivo
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1.5s infinite' }} />
                <span style={{ fontSize: 13, color: '#f59e0b' }}>Aguardando escaneamento...</span>
              </div>
              <button onClick={conectar} disabled={loading}
                style={{ background: 'var(--avp-border)', color: 'var(--avp-text-dim)', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12 }}>
                Gerar novo QR Code
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#e6394620', border: '1px solid var(--avp-danger)', borderRadius: 8, padding: '10px 14px' }}>
                <span>⚠️</span>
                <p style={{ fontSize: 13, color: 'var(--avp-danger)' }}>WhatsApp não conectado — notificações desativadas</p>
              </div>
              <button onClick={conectar} disabled={loading}
                style={{ background: '#25d366', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, alignSelf: 'flex-start', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Gerando QR...' : '📱 Conectar WhatsApp'}
              </button>
            </div>
          )}
        </div>
      )}

      {msg && (
        <p style={{ marginTop: 12, fontSize: 13, color: msg.includes('sucesso') || msg.includes('conectado') ? 'var(--avp-green)' : msg.includes('Erro') ? 'var(--avp-danger)' : '#f59e0b' }}>
          {msg}
        </p>
      )}
    </div>
  )
}
