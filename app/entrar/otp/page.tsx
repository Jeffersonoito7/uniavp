import OtpForm from '@/app/components/OtpForm'

export default function EntrarOtpPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020d1a 0%, #03183a 60%, #021a0e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', padding: 20,
    }}>
      <div style={{ width: 420, maxWidth: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🔐</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>
            Verificação de segurança
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
            Digite o código de 6 dígitos enviado para você
          </p>
        </div>

        <div style={{
          background: 'rgba(15,23,42,0.85)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 20, padding: 32,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        }}>
          <OtpForm />
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
          🔒 Verificação obrigatória a cada acesso
        </p>
        <p style={{ textAlign: 'center', marginTop: 8, fontSize: 12 }}>
          <a href="/entrar" style={{ color: 'rgba(99,102,241,0.6)', textDecoration: 'none' }}>
            ← Voltar ao login
          </a>
        </p>
      </div>
    </div>
  )
}
