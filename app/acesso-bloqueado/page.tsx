import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AcessoBloqueadoPage() {
  // Se nao tem sessao, manda para o login
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--avp-black, #08090d)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        maxWidth: 440,
        width: '100%',
        background: 'var(--avp-card, #0f111a)',
        border: '1px solid var(--avp-border, rgba(255,255,255,0.08))',
        borderRadius: 16,
        padding: 40,
        textAlign: 'center',
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: '#e6394615',
          border: '1px solid #e6394640',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: 28,
        }}>
          X
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
          Acesso bloqueado
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 32 }}>
          Sua conta foi desativada. Entre em contato com o suporte da plataforma para mais informacoes.
        </p>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10,
              padding: '12px',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Sair da conta
          </button>
        </form>
      </div>
    </div>
  )
}
