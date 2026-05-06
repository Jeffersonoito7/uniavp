import PlanosCliente from './PlanosCliente';
import ThemeToggle from '@/app/components/ThemeToggle';

export default function PlanosPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 20% 0%, rgba(51,54,135,0.4) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(2,161,83,0.3) 0%, transparent 50%), var(--avp-black)',
      padding: '60px 5%',
    }}>
      <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 100 }}>
        <ThemeToggle />
      </div>

      <div style={{ textAlign: 'center', marginBottom: 60, maxWidth: 640, margin: '0 auto 60px' }}>
        <a href="/login" style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--avp-text-dim)', textDecoration: 'none', display: 'block', marginBottom: 24 }}>
          ← Voltar ao Login
        </a>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, margin: '0 0 16px', letterSpacing: 2 }}>
          Escolha seu{' '}
          <span className="text-gradient">Plano</span>
        </h1>
        <p style={{ fontSize: 16, color: 'var(--avp-text-dim)', margin: 0, lineHeight: 1.6 }}>
          Leve a Universidade AVP para sua empresa. Treine consultores, automatize certificados e acompanhe resultados em tempo real.
        </p>
      </div>

      <PlanosCliente />

      <div style={{ textAlign: 'center', marginTop: 60 }}>
        <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', margin: 0 }}>
          Dúvidas? Fale conosco pelo WhatsApp
        </p>
      </div>
    </div>
  );
}
