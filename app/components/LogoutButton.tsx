'use client'
import { createBrowserClient } from '@supabase/ssr'

export default function LogoutButton({ style }: { style?: React.CSSProperties }) {
  async function sair() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    // Apaga o cookie OTP para forçar nova verificação no próximo login
    document.cookie = 'otp_ok=; Max-Age=0; path=/'
    window.location.href = '/entrar'
  }

  return (
    <button
      onClick={sair}
      style={{
        background: 'none',
        border: '1px solid var(--avp-border)',
        color: 'var(--avp-text-dim)',
        borderRadius: 8,
        padding: '6px 14px',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600,
        ...style,
      }}
    >
      Sair
    </button>
  )
}
