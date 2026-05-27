'use client'
import Link from 'next/link'
import EventosWidget from '@/app/components/EventosWidget'
import MuralNoticias from '@/app/components/MuralNoticias'
import LogoutButton from '@/app/components/LogoutButton'
import PushButton from '@/app/components/PushButton'
import PWAInstallButton from '@/app/components/PWAInstallButton'
import ThemeToggle from '@/app/components/ThemeToggle'

type Props = {
  whatsapp: string
  aluno: { nome: string; status: string }
  siteConfig: { logoUrl?: string | null; nome: string }
}

export default function AlunoHeader({ whatsapp, aluno, siteConfig }: Props) {
  return (
    <header style={{
      background: 'var(--avp-header-bg)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--avp-border)',
      padding: '0 20px',
      height: 62,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {siteConfig.logoUrl && !siteConfig.logoUrl.startsWith('/') ? (
          <img src={siteConfig.logoUrl} alt={siteConfig.nome} className="logo-site" style={{ height: 34, objectFit: 'contain' }} />
        ) : (
          <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--avp-text)', letterSpacing: '-0.01em' }}>{siteConfig.nome}</span>
        )}
      </div>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link href={`/aluno/${whatsapp}/forum`}
          className="hide-mobile"
          style={{ color: 'var(--avp-text-dim)', fontSize: 13, textDecoration: 'none', fontWeight: 500, padding: '6px 10px', borderRadius: 8 }}>
          Fórum
        </Link>
        <Link href={`/aluno/${whatsapp}/loja`}
          className="hide-mobile"
          style={{ color: 'var(--avp-text-dim)', fontSize: 13, textDecoration: 'none', fontWeight: 500, padding: '6px 10px', borderRadius: 8 }}>
          Loja
        </Link>
        {aluno.status === 'concluido' && (
          <Link href={`/aluno/${whatsapp}/carteira`}
            style={{ color: '#fbbf24', fontSize: 13, textDecoration: 'none', fontWeight: 700, padding: '6px 10px', borderRadius: 8, background: '#fbbf2415', border: '1px solid #fbbf2440' }}
            title="Minha Carteira de Formação">
            🎓 Carteira
          </Link>
        )}
        <a href="/upgrade" className="btn btn-primary"
          style={{ flexShrink: 0, textDecoration: 'none', fontSize: 12, padding: '5px 12px', gap: 5 }}>
          UNIAVP PRO
        </a>
        <ThemeToggle inline />
        <PushButton />
        <PWAInstallButton />
        <MuralNoticias />
        <EventosWidget />
        <a href={`/aluno/${whatsapp}/perfil`} style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', marginLeft: 4 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(79,70,229,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0 }}>
            {aluno.nome.charAt(0).toUpperCase()}
          </div>
          <span className="hide-mobile" style={{ fontSize: 13, fontWeight: 600, color: 'var(--avp-text)' }}>{aluno.nome.split(' ')[0]}</span>
        </a>
        <LogoutButton />
      </nav>
    </header>
  )
}
