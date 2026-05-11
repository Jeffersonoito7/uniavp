'use client'
import { useState, useEffect } from 'react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export default function PushButton() {
  const [status, setStatus] = useState<'loading' | 'unsupported' | 'denied' | 'subscribed' | 'idle'>('loading')
  const [anim, setAnim] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported'); return
    }
    Notification.requestPermission === undefined
      ? setStatus('unsupported')
      : checkSubscription()
  }, [])

  async function checkSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setStatus(sub ? 'subscribed' : Notification.permission === 'denied' ? 'denied' : 'idle')
    } catch { setStatus('idle') }
  }

  async function subscribe() {
    try {
      const reg = await navigator.serviceWorker.ready
      const res = await fetch('/api/push/subscribe')
      const { publicKey } = await res.json()
      if (!publicKey) return

      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setStatus('denied'); return }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      setStatus('subscribed')
      setAnim(true)
      setTimeout(() => setAnim(false), 1500)
    } catch { setStatus('idle') }
  }

  async function unsubscribe() {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) return
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
      setStatus('idle')
    } catch {}
  }

  if (status === 'unsupported') return null

  const isOn = status === 'subscribed'
  const tooltip = isOn ? 'Notificações ativas — clique para desativar' : status === 'denied' ? 'Notificações bloqueadas pelo navegador' : 'Ativar notificações'

  return (
    <button
      onClick={isOn ? unsubscribe : status === 'denied' ? undefined : subscribe}
      title={tooltip}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 34, height: 34, borderRadius: 8, border: 'none',
        background: isOn ? 'rgba(2,161,83,0.15)' : 'rgba(255,255,255,0.06)',
        color: isOn ? '#4ade80' : status === 'denied' ? 'var(--avp-text-dim)' : 'var(--avp-text-dim)',
        cursor: status === 'denied' ? 'default' : 'pointer',
        fontSize: 16,
        transform: anim ? 'scale(1.3)' : 'scale(1)',
        transition: 'transform 0.3s ease, background 0.2s',
        opacity: status === 'loading' ? 0 : 1,
      }}
    >
      {isOn ? '🔔' : '🔕'}
    </button>
  )
}
