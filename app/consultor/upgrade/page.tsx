import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getSiteConfig } from '@/lib/site-config'

export default async function UpgradePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const adminClient = createServiceRoleClient()
  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp').eq('user_id', user.id).maybeSingle()
  if (!aluno) redirect('/entrar')

  const config = await getSiteConfig()

  const beneficios = [
    { icon: '📚', titulo: 'Aulas ilimitadas', desc: 'Acesse todo o conteúdo da plataforma sem restrições' },
    { icon: '👥', titulo: 'Gerencie sua equipe', desc: 'Cadastre, acompanhe e reengaje consultores da sua equipe' },
    { icon: '🔗', titulo: 'Links de captação', desc: 'Links personalizados para captar novos consultores' },
    { icon: '📊', titulo: 'Relatórios e métricas', desc: 'Veja o progresso da equipe, inativos e progresso médio' },
    { icon: '💬', titulo: 'WhatsApp direto', desc: 'Envie mensagens para consultores diretamente do painel' },
    { icon: '🎨', titulo: 'Templates de arte', desc: 'Crie e personalize artes para sua equipe compartilhar' },
    { icon: '🤝', titulo: 'Indicações ilimitadas', desc: 'Indique sem limite — na UNIAVP FREE o limite é 50' },
    { icon: '🏆', titulo: 'Carteira de Formação', desc: 'Certificado e carteirinha para sua equipe' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ background: 'var(--avp-card)', borderBottom: '1px solid var(--avp-border)', padding: '0 24px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href={`/free/${aluno.whatsapp}`} style={{ color: 'var(--avp-text-dim)', textDecoration: 'none', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Voltar
        </a>
        <span style={{ fontWeight: 800, fontSize: 15 }}>🚀 Faça Upgrade</span>
        <div />
      </header>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(24px, 5vw, 48px) 20px 60px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 100, padding: '6px 18px', fontSize: 12, fontWeight: 700, color: '#818cf8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 20 }}>
            ✨ UNIAVP PRO
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', fontWeight: 900, lineHeight: 1.2, marginBottom: 16 }}>
            Você chegou ao limite da<br />
            <span style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>UNIAVP FREE</span>
          </h1>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 16, lineHeight: 1.7, maxWidth: 480, margin: '0 auto' }}>
            Na UNIAVP FREE você acessa as primeiras <strong style={{ color: 'var(--avp-text)' }}>20 aulas</strong>.
            Faça upgrade para a <strong style={{ color: '#818cf8' }}>UNIAVP PRO</strong> e desbloqueie tudo — sem limites.
          </p>
        </div>

        {/* Comparativo Free vs Pro */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 36 }}>
          {/* Free */}
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--avp-text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>UNIAVP FREE</p>
            <p style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>Grátis</p>
            {[
              '✅ 20 aulas',
              '✅ Indicar até 50 pessoas',
              '❌ Gestão de equipe',
              '❌ Aulas ilimitadas',
              '❌ Relatórios',
            ].map(item => (
              <p key={item} style={{ fontSize: 13, color: item.startsWith('❌') ? 'var(--avp-text-dim)' : 'var(--avp-text)', marginBottom: 6, opacity: item.startsWith('❌') ? 0.5 : 1 }}>{item}</p>
            ))}
          </div>
          {/* Pro */}
          <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))', border: '2px solid rgba(99,102,241,0.4)', borderRadius: 16, padding: 24, position: 'relative' }}>
            <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 100, padding: '4px 16px', fontSize: 11, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>
              RECOMENDADO
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>UNIAVP PRO</p>
            <p style={{ fontSize: 28, fontWeight: 900, marginBottom: 16, color: '#818cf8' }}>Mensal</p>
            {[
              '✅ Aulas ilimitadas',
              '✅ Indicações ilimitadas',
              '✅ Gestão de equipe',
              '✅ Relatórios e métricas',
              '✅ Templates de arte',
            ].map(item => (
              <p key={item} style={{ fontSize: 13, color: '#c4b5fd', marginBottom: 6 }}>{item}</p>
            ))}
          </div>
        </div>

        {/* Benefícios */}
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: '24px 28px', marginBottom: 32 }}>
          <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 20 }}>🎯 Tudo que você ganha na UNIAVP PRO</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {beneficios.map(b => (
              <div key={b.titulo} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{b.icon}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{b.titulo}</p>
                  <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', lineHeight: 1.5 }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <a href="/assinar-pro"
            style={{ display: 'inline-block', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: 14, padding: '18px 48px', fontWeight: 900, fontSize: 18, textDecoration: 'none', boxShadow: '0 8px 32px rgba(99,102,241,0.4)', marginBottom: 12 }}>
            🚀 Quero ser UNIAVP PRO
          </a>
          <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginTop: 10 }}>
            Você terá acesso imediato a todas as aulas e ao painel de gestão.
          </p>
          <a href={`/free/${aluno.whatsapp}`} style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 16, textDecoration: 'none' }}>
            Voltar para minhas aulas →
          </a>
        </div>
      </div>
    </div>
  )
}
