import { getSiteConfig } from '@/lib/site-config'
import { createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export default async function PlanoFreePage() {
  const config = await getSiteConfig()
  const admin = createServiceRoleClient()
  const { data: valorCfg } = await (admin.from('configuracoes') as any)
    .select('valor').eq('chave', 'plano_pro_valor').maybeSingle()
  const valorPro = Math.max(1, parseFloat(String(valorCfg?.valor ?? '').replace(/"/g, '')) || 97)

  const beneficios = [
    { icon: '🎓', titulo: 'Acesso à plataforma de ensino', desc: 'Entre na universidade e comece a aprender com conteúdo de qualidade.' },
    { icon: '📚', titulo: 'Módulos de treinamento', desc: 'Aulas organizadas por módulos para facilitar seu aprendizado.' },
    { icon: '🏆', titulo: 'Certificado de conclusão', desc: 'Ao concluir os módulos, receba seu certificado de formação.' },
    { icon: '🤝', titulo: 'Indique e ganhe', desc: 'Indique amigos para a plataforma e acompanhe seu progresso.' },
    { icon: '📱', titulo: 'Acesso pelo celular', desc: 'Estude onde quiser, no celular ou computador.' },
    { icon: '💬', titulo: 'Suporte pelo WhatsApp', desc: 'Tire dúvidas diretamente com o suporte da plataforma.' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {config.logoMenuUrl && <img src={config.logoMenuUrl} alt={config.nome} style={{ height: 32, objectFit: 'contain' }} />}
          <span style={{ fontWeight: 800, fontSize: 16 }}>{config.nome}</span>
        </div>
        <a href="/captacao?direto=1"
          style={{ background: 'linear-gradient(135deg, #02A153, #00c46a)', color: '#fff', borderRadius: 10, padding: '9px 22px', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
          Cadastrar grátis
        </a>
      </header>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(40px, 6vw, 80px) 20px 80px' }}>

        {/* Badge */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(2,161,83,0.15)', border: '1px solid rgba(2,161,83,0.35)', borderRadius: 100, padding: '6px 20px', fontSize: 12, fontWeight: 700, color: '#4ade80', letterSpacing: 1 }}>
            🆓 TOTALMENTE GRATUITO
          </span>
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3.4rem)', fontWeight: 900, lineHeight: 1.15, marginBottom: 20 }}>
            Comece sua jornada<br />
            <span style={{ background: 'linear-gradient(90deg, #02A153, #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>100% de graça</span>
          </h1>
          <p style={{ color: 'rgba(241,245,249,0.6)', fontSize: 'clamp(15px, 2.5vw, 18px)', lineHeight: 1.8, maxWidth: 540, margin: '0 auto 32px' }}>
            A <strong style={{ color: '#f1f5f9' }}>{config.nome} FREE</strong> é para quem quer aprender, crescer e desenvolver habilidades — sem pagar nada para começar.
          </p>
          <a href="/captacao?direto=1"
            style={{ display: 'inline-block', background: 'linear-gradient(135deg, #02A153, #00c46a)', color: '#fff', borderRadius: 14, padding: '18px 48px', fontWeight: 900, fontSize: 18, textDecoration: 'none', boxShadow: '0 8px 32px rgba(2,161,83,0.35)' }}>
            Quero meu acesso grátis →
          </a>
          <p style={{ fontSize: 12, color: 'rgba(241,245,249,0.4)', marginTop: 12 }}>Sem cartão de crédito. Sem burocracia.</p>
        </div>

        {/* Benefícios */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 'clamp(24px, 4vw, 40px)', marginBottom: 40 }}>
          <p style={{ fontWeight: 800, fontSize: 18, marginBottom: 28, textAlign: 'center' }}>O que você ganha no plano FREE</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {beneficios.map(b => (
              <div key={b.titulo} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{b.icon}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{b.titulo}</p>
                  <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.55)', lineHeight: 1.6 }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparativo FREE vs PRO */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 48 }}>
          {/* FREE */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(2,161,83,0.5)', borderRadius: 16, padding: 28 }}>
            <div style={{ display: 'inline-block', background: 'rgba(2,161,83,0.2)', borderRadius: 100, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: '#4ade80', marginBottom: 14, letterSpacing: 1 }}>VOCÊ AGORA</div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(241,245,249,0.5)', marginBottom: 8 }}>FREE</p>
            <p style={{ fontSize: 32, fontWeight: 900, color: '#4ade80', marginBottom: 20 }}>Grátis</p>
            {[
              ['✅', 'Acesso aos módulos de treinamento'],
              ['✅', 'Certificado de conclusão'],
              ['✅', 'Indicar novos membros'],
              ['⬜', 'Painel de gestão de equipe'],
              ['⬜', 'Relatórios e métricas'],
              ['⬜', 'Templates de arte personalizados'],
            ].map(([ic, txt]) => (
              <p key={txt} style={{ fontSize: 13, marginBottom: 8, display: 'flex', gap: 8, alignItems: 'flex-start', color: ic === '⬜' ? 'rgba(241,245,249,0.3)' : 'rgba(241,245,249,0.85)' }}>
                <span style={{ flexShrink: 0 }}>{ic === '⬜' ? '—' : '✓'}</span>{txt}
              </p>
            ))}
          </div>

          {/* PRO */}
          <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))', border: '2px solid rgba(99,102,241,0.4)', borderRadius: 16, padding: 28, position: 'relative' }}>
            <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 100, padding: '4px 18px', fontSize: 11, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>
              PRÓXIMO NÍVEL
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#818cf8', marginBottom: 8 }}>PRO</p>
            <p style={{ fontSize: 32, fontWeight: 900, color: '#818cf8', marginBottom: 4 }}>R${valorPro}<span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(241,245,249,0.4)' }}>/mês</span></p>
            <p style={{ fontSize: 11, color: 'rgba(241,245,249,0.4)', marginBottom: 16 }}>ou GRÁTIS com 20 PROs na rede</p>
            {[
              'Tudo do FREE, mais:',
              '✓ Painel completo de gestão',
              '✓ Relatórios da equipe',
              '✓ Templates de arte',
              '✓ Links de captação exclusivos',
              '✓ WhatsApp direto para equipe',
            ].map(txt => (
              <p key={txt} style={{ fontSize: 13, marginBottom: 8, color: txt.startsWith('✓') ? '#c4b5fd' : 'rgba(241,245,249,0.5)', fontWeight: txt === 'Tudo do FREE, mais:' ? 600 : 400 }}>
                {txt}
              </p>
            ))}
            <a href="/planos/pro" style={{ display: 'block', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, textDecoration: 'none', textAlign: 'center', marginTop: 16 }}>
              Conhecer o PRO →
            </a>
          </div>
        </div>

        {/* CTA final */}
        <div style={{ textAlign: 'center', background: 'linear-gradient(135deg, rgba(2,161,83,0.12), rgba(0,196,106,0.06))', border: '1px solid rgba(2,161,83,0.25)', borderRadius: 20, padding: 'clamp(32px, 5vw, 56px) 24px' }}>
          <p style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Pronto para começar?</p>
          <p style={{ color: 'rgba(241,245,249,0.55)', fontSize: 15, marginBottom: 28 }}>Faça seu cadastro agora e tenha acesso imediato à plataforma.</p>
          <a href="/captacao?direto=1"
            style={{ display: 'inline-block', background: 'linear-gradient(135deg, #02A153, #00c46a)', color: '#fff', borderRadius: 14, padding: '18px 52px', fontWeight: 900, fontSize: 18, textDecoration: 'none', boxShadow: '0 8px 32px rgba(2,161,83,0.35)' }}>
            Criar conta grátis
          </a>
          <p style={{ fontSize: 12, color: 'rgba(241,245,249,0.35)', marginTop: 14 }}>
            Já tem conta? <a href="/entrar" style={{ color: '#4ade80', textDecoration: 'none' }}>Entrar →</a>
          </p>
        </div>

      </div>
    </div>
  )
}
