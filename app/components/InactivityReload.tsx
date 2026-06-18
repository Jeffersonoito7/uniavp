'use client'
import { useEffect, useRef } from 'react'

// Recarrega a pagina apos X minutos sem nenhuma interacao do usuario.
// Quando o servidor recebe a requisicao recarregada, a sessao Supabase e
// revalidada — se tiver expirado, o usuario e redirecionado para o login.
const INATIVIDADE_MS = 30 * 60 * 1000 // 30 minutos

const EVENTOS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const

export default function InactivityReload() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function resetar() {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        window.location.reload()
      }, INATIVIDADE_MS)
    }

    resetar()
    EVENTOS.forEach(ev => window.addEventListener(ev, resetar, { passive: true }))

    return () => {
      if (timer.current) clearTimeout(timer.current)
      EVENTOS.forEach(ev => window.removeEventListener(ev, resetar))
    }
  }, [])

  return null
}
