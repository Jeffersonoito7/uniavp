import OtpForm from '@/app/components/OtpForm'

export default function GestorOtpPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020d1a 0%, #0a1a0a 50%, #010d1f 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', padding: 20,
    }}>
      <div style={{ width: 400, maxWidth: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🔐</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Verificação de segurança</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
            Digite o código de 6 dígitos enviado no seu WhatsApp ou e-mail
          </p>
        </div>

        <div style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(2,161,83,0.3)', borderRadius: 16, padding: 32, backdropFilter: 'blur(8px)' }}>
          <OtpForm />
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          🔒 Verificação obrigatória a cada acesso — Painel PRO
        </p>
      </div>
    </div>
  )
}
