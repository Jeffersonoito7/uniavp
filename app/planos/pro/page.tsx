import { getSiteConfig } from '@/lib/site-config'
import { createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export default async function PlanoProPage() {
  const config = await getSiteConfig()
  const admin = createServiceRoleClient()

  const { data: valorCfg } = await (admin.from('configuracoes') as any)
    .select('valor').eq('chave', 'plano_pro_valor').maybeSingle()
  const valorPro = Math.max(1, parseFloat(String(valorCfg?.valor ?? '').replace(/"/g, '')) || 97)

  const { count: totalPros } = await (admin.from('gestores') as any)
    .select('id', { count: 'exact', head: true }).eq('ativo', true).eq('status_assinatura', 'ativo')
  const { count: totalFrees } = await (admin.from('alunos') as any)
    .select('id', { count: 'exact', head: true }).eq('ativo', true)

  const beneficios = [
    { icon: '👥', titulo: 'Gestão completa da equipe', desc: 'Veja todos os FREEs da sua rede, status, progresso e data de cadastro em um painel centralizado.' },
    { icon: '📊', titulo: 'Relatórios e métricas', desc: 'Acompanhe inativos, progresso médio da equipe, engajamento e receba relatório semanal por WhatsApp.' },
    { icon: '🔗', titulo: 'Links de captação exclusivos', desc: 'Links personalizados para captar FREEs e novos PROs com rastreamento automático.' },
    { icon: '🎨', titulo: 'Templates de arte', desc: 'Crie artes profissionais personalizadas com a foto de boas-vindas de cada FREE da sua equipe.' },
    { icon: '💬', titulo: 'WhatsApp integrado', desc: 'Envie mensagens direto do painel para qualquer membro da equipe sem sair da plataforma.' },
    { icon: '📚', titulo: 'Conteúdo ilimitado', desc: 'Acesso a todos os módulos e aulas, incluindo conteúdos exclusivos marcados como PRO.' },
    { icon: '🏆', titulo: 'Certificados e carteirinha', desc: 'Emita certificados de conclusão e carteirinha de formação para sua equipe completa.' },
    { icon: '⚡', titulo: 'Automação de reengajamento', desc: 'O sistema avisa você automaticamente sobre FREEs inativos para você agir antes de perdê-los.' },
    { icon: '🎁', titulo: 'PRO gratuito por rede', desc: 'Ative 20 PROs na sua rede e sua assinatura fica ZERO — sem pagar mensalidade enquanto mantiver.' },
    { icon: '🔔', titulo: 'Alertas em tempo real', desc: 'Receba notificações por WhatsApp quando alguém entra na equipe, conclui módulo ou fica inativo.' },
  ]

  const faq = [
    { q: 'Posso cancelar quando quiser?', r: 'Sim. Não há fidelidade. Seu acesso fica ativo até o fim do período pago.' },
    { q: 'O que acontece com minha equipe se eu cancelar?', r: 'Sua equipe FREE continua com acesso ao plano gratuito deles. Você perde o painel de gestão.' },
    { q: 'Como funciona o PRO gratuito por rede?', r: `Se você indicar 20 PROs ativos para a plataforma, sua assinatura fica ZERO. Enquanto os 20 mantiverem o plano, você não paga. Se algum cancelar, você recebe um alerta para repor.` },
    { q: 'Tem período de teste?', r: 'Não há trial. O pagamento é via PIX e o acesso é liberado imediatamente após a confirmação.' },
    { q: 'Posso usar em qualquer dispositivo?', r: 'Sim. A plataforma funciona em celular, tablet e computador, sem precisar instalar nada.' },
    { q: 'Qual é a diferença entre FREE e PRO?', r: 'O FREE acessa os módulos de treinamento. O PRO, além do conteúdo, gerencia toda sua equipe FREE com painel, relatórios, artes e ferramentas de engajamento.' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {config.logoMenuUrl && <img src={config.logoMenuUrl} alt={config.nome} style={{ height: 32, objectFit: 'contain' }} />}
          <span style={{ fontWeight: 800, fontSize: 16 }}>{config.nome}</span>
        </div>
        <a href="/captacao?direto=1&plano=pro"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: 10, padding: '9px 22px', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
          Quero ser PRO
        </a>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(40px, 6vw, 80px) 20px 100px' }}>

        {/* Badge */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: 100, padding: '6px 20px', fontSize: 12, fontWeight: 700, color: '#818cf8', letterSpacing: 1 }}>
            ✨ UNIAVP PRO
          </span>
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 900, lineHeight: 1.15, marginBottom: 20 }}>
            Gerencie sua equipe.<br />
            <span style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Cresça com método.</span>
          </h1>
          <p style={{ color: 'rgba(241,245,249,0.6)', fontSize: 'clamp(15px, 2.5vw, 18px)', lineHeight: 1.8, maxWidth: 580, margin: '0 auto 36px' }}>
            O <strong style={{ color: '#c4b5fd' }}>UNIAVP PRO</strong> é o painel completo para líderes que querem acompanhar, engajar e fazer crescer a sua equipe de FREEs — tudo em um só lugar.
          </p>

          {/* Stats */}
          {(totalPros || totalFrees) ? (
            <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginBottom: 36, flexWrap: 'wrap' }}>
              {totalPros ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 36, fontWeight: 900, color: '#818cf8', lineHeight: 1 }}>{totalPros}+</p>
                  <p style={{ fontSize: 12, color: 'rgba(241,245,249,0.4)', marginTop: 4 }}>PROs ativos</p>
                </div>
              ) : null}
              {totalFrees ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 36, fontWeight: 900, color: '#4ade80', lineHeight: 1 }}>{totalFrees}+</p>
                  <p style={{ fontSize: 12, color: 'rgba(241,245,249,0.4)', marginTop: 4 }}>membros FREE</p>
                </div>
              ) : null}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 36, fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>R${valorPro}</p>
                <p style={{ fontSize: 12, color: 'rgba(241,245,249,0.4)', marginTop: 4 }}>por mês</p>
              </div>
            </div>
          ) : null}

          <a href="/captacao?direto=1&plano=pro"
            style={{ display: 'inline-block', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: 14, padding: '18px 52px', fontWeight: 900, fontSize: 18, textDecoration: 'none', boxShadow: '0 8px 32px rgba(99,102,241,0.4)', marginBottom: 12 }}>
            🚀 Começar agora — R${valorPro}/mês
          </a>
          <p style={{ fontSize: 12, color: 'rgba(241,245,249,0.4)', marginTop: 12 }}>
            Pagamento via PIX • Acesso imediato • Cancele quando quiser
          </p>
        </div>

        {/* Destaque: PRO grátis por rede */}
        <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 20, padding: 28, marginBottom: 48, textAlign: 'center' }}>
          <p style={{ fontSize: 28, marginBottom: 8 }}>🎁</p>
          <p style={{ fontWeight: 900, fontSize: 20, color: '#c4b5fd', marginBottom: 8 }}>Sua assinatura pode ser ZERO</p>
          <p style={{ color: 'rgba(241,245,249,0.6)', fontSize: 15, maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
            Indique <strong style={{ color: '#fff' }}>20 PROs ativos</strong> para a plataforma e sua mensalidade fica <strong style={{ color: '#4ade80' }}>completamente gratuita</strong> — enquanto eles mantiverem o plano.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 20px', fontSize: 13 }}>
              <strong style={{ color: '#818cf8' }}>20 PROs ativos</strong>
              <span style={{ color: 'rgba(241,245,249,0.4)' }}> = PRO gratuito</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 20px', fontSize: 13 }}>
              <strong style={{ color: '#fbbf24' }}>Alerta automático</strong>
              <span style={{ color: 'rgba(241,245,249,0.4)' }}> se alguém cancelar</span>
            </div>
          </div>
        </div>

        {/* Benefícios */}
        <div style={{ marginBottom: 56 }}>
          <p style={{ fontWeight: 800, fontSize: 22, marginBottom: 8, textAlign: 'center' }}>Tudo que o PRO inclui</p>
          <p style={{ color: 'rgba(241,245,249,0.45)', fontSize: 14, textAlign: 'center', marginBottom: 36 }}>Um painel completo para líderes que levam a equipe a sério.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {beneficios.map(b => (
              <div key={b.titulo} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 22px', display: 'flex', gap: 14, alignItems: 'flex-start', transition: 'border-color 0.2s' }}>
                <span style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{b.icon}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 5 }}>{b.titulo}</p>
                  <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.5)', lineHeight: 1.6 }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparativo */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden', marginBottom: 56 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: 14, color: 'rgba(241,245,249,0.5)', fontWeight: 600 }}>Recurso</th>
                <th style={{ padding: '20px 16px', textAlign: 'center', fontSize: 14, color: '#4ade80', fontWeight: 700 }}>FREE</th>
                <th style={{ padding: '20px 16px', textAlign: 'center', fontSize: 14, color: '#818cf8', fontWeight: 700, background: 'rgba(99,102,241,0.08)' }}>✨ PRO</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Módulos de treinamento', '✓', '✓'],
                ['Certificado de conclusão', '✓', '✓'],
                ['Indicar novos membros', '✓', '✓'],
                ['Aulas exclusivas PRO', '—', '✓'],
                ['Painel de gestão de equipe', '—', '✓'],
                ['Relatórios e métricas', '—', '✓'],
                ['Templates de arte personalizados', '—', '✓'],
                ['WhatsApp integrado', '—', '✓'],
                ['Links de captação rastreados', '—', '✓'],
                ['Alertas de FREEs inativos', '—', '✓'],
                ['PRO gratuito por rede', '—', '✓'],
              ].map(([recurso, free, pro], i) => (
                <tr key={recurso} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                  <td style={{ padding: '14px 24px', fontSize: 14, color: 'rgba(241,245,249,0.75)' }}>{recurso}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 15, color: free === '✓' ? '#4ade80' : 'rgba(241,245,249,0.2)' }}>{free}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 15, color: pro === '✓' ? '#818cf8' : 'rgba(241,245,249,0.2)', background: 'rgba(99,102,241,0.05)' }}>{pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 56 }}>
          <p style={{ fontWeight: 800, fontSize: 22, marginBottom: 32, textAlign: 'center' }}>Perguntas frequentes</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faq.map(({ q, r }) => (
              <div key={q} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px' }}>
                <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{q}</p>
                <p style={{ fontSize: 14, color: 'rgba(241,245,249,0.55)', lineHeight: 1.7 }}>{r}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div style={{ textAlign: 'center', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 24, padding: 'clamp(36px, 6vw, 64px) 24px' }}>
          <p style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 900, marginBottom: 12 }}>Pronto para liderar?</p>
          <p style={{ color: 'rgba(241,245,249,0.55)', fontSize: 15, marginBottom: 32, maxWidth: 440, margin: '0 auto 32px' }}>
            Junte-se a quem já usa o UNIAVP PRO para gerenciar e crescer sua equipe com método.
          </p>
          <a href="/captacao?direto=1&plano=pro"
            style={{ display: 'inline-block', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: 14, padding: '20px 60px', fontWeight: 900, fontSize: 20, textDecoration: 'none', boxShadow: '0 8px 40px rgba(99,102,241,0.45)', marginBottom: 16 }}>
            🚀 Quero ser PRO — R${valorPro}/mês
          </a>
          <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.35)', marginTop: 14 }}>
            Pagamento via PIX • Acesso em minutos • Sem fidelidade
          </p>
          <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.3)', marginTop: 10 }}>
            Já tem conta? <a href="/entrar" style={{ color: '#818cf8', textDecoration: 'none' }}>Entrar →</a>&nbsp;&nbsp;|&nbsp;&nbsp;
            Prefere o FREE? <a href="/planos/free" style={{ color: '#4ade80', textDecoration: 'none' }}>Ver plano gratuito →</a>
          </p>
        </div>

      </div>
    </div>
  )
}
