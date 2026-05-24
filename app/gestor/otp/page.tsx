import OtpForm from '@/app/components/OtpForm'

export default function GestorOtpPage() {
  return (
    <div className="page-wrap">
      <div style={{ width: 400, maxWidth: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>Verificação de segurança</h1>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>
            Digite o código de 6 dígitos enviado no seu WhatsApp ou e-mail
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <OtpForm />
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--avp-text-dim)' }}>
          Verificação obrigatória a cada acesso — Painel PRO
        </p>
      </div>
    </div>
  )
}
