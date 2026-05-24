import OtpForm from '@/app/components/OtpForm'

export default function EntrarOtpPage() {
  return (
    <div className="page-wrap">
      <div style={{ width: 420, maxWidth: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>
            Verificação de segurança
          </h1>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>
            Digite o código de 6 dígitos enviado para você
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <OtpForm />
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--avp-text-dim)' }}>
          Verificação obrigatória a cada acesso
        </p>
        <p style={{ textAlign: 'center', marginTop: 8, fontSize: 12 }}>
          <a href="/entrar" style={{ color: 'var(--avp-blue)', textDecoration: 'none', opacity: 0.7 }}>
            ← Voltar ao login
          </a>
        </p>
      </div>
    </div>
  )
}
