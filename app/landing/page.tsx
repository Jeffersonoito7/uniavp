import { createServiceRoleClient } from '@/lib/supabase-server'
import Link from 'next/link'
import type { PlanoSaaS } from '@/app/api/super/planos/route'

export const dynamic = 'force-dynamic'

const PLANOS_DEFAULT: PlanoSaaS[] = [
  {
    id: 'starter', nome: 'Starter', descricao: 'Ideal para associações em crescimento',
    preco: 0, gestor_ativo: false, limite_consultores: 100, destaque: false, ativo: true,
    recursos: ['Módulos e aulas ilimitadas', 'Área do consultor', 'Painel admin completo', 'Quiz e certificados', 'Contratos digitais', 'Suporte por WhatsApp'],
  },
  {
    id: 'profissional', nome: 'Profissional', descricao: 'Para associações consolidadas',
    preco: 0, gestor_ativo: false, limite_consultores: 500, destaque: true, ativo: true,
    recursos: ['Tudo do Starter', 'Até 500 consultores', 'Ranking e gamificação', 'Artes para redes sociais', 'Relatórios avançados', 'Onboarding guiado'],
  },
  {
    id: 'enterprise', nome: 'Enterprise', descricao: 'Solução completa para grandes associações',
    preco: 0, gestor_ativo: true, limite_consultores: 9999, destaque: false, ativo: true,
    recursos: ['Tudo do Profissional', 'Painel exclusivo para usuários PRO', 'Consultores ilimitados', 'Domínio próprio incluso', 'Suporte prioritário', 'Treinamento da equipe'],
  },
]

const FEATURES = [
  { icon: '🎓', titulo: 'Treinamentos e Módulos', desc: 'Monte cursos completos com vídeos, PDFs e quizzes. Acompanhe o progresso de cada consultor.' },
  { icon: '📄', titulo: 'Contratos Digitais', desc: 'Consultores assinam contratos online com hash SHA-256, validade jurídica e PDF gerado automaticamente.' },
  { icon: '🏆', titulo: 'Ranking e Certificados', desc: 'Gamificação, certificados automáticos e ranking motivam seus consultores a avançar.' },
  { icon: '🧑‍💼', titulo: 'Usuários PRO', desc: 'Cada PRO gerencia sua própria equipe de consultores FREE com painel exclusivo.' },
  { icon: '🌐', titulo: 'Marca Própria (White-Label)', desc: 'Plataforma com sua logo, suas cores e seu domínio. Seus consultores nem sabem que é terceirizado.' },
  { icon: '📲', titulo: 'WhatsApp Integrado', desc: 'Notificações automáticas, envio de contratos, cobranças e avisos direto no WhatsApp.' },
]

export default async function LandingPage() {
  const adminClient = createServiceRoleClient()
  const { data: cfgPlanos } = await (adminClient.from('configuracoes') as any)
    .select('valor').eq('chave', 'planos_saas').maybeSingle()
  const { data: cfgNome } = await (adminClient.from('configuracoes') as any)
    .select('valor').eq('chave', 'landing_nome_plataforma').maybeSingle()
  const { data: cfgDescricao } = await (adminClient.from('configuracoes') as any)
    .select('valor').eq('chave', 'landing_descricao').maybeSingle()
  const { data: cfgWpp } = await (adminClient.from('configuracoes') as any)
    .select('valor').eq('chave', 'landing_whatsapp_contato').maybeSingle()

  let planos: PlanoSaaS[] = PLANOS_DEFAULT
  try { if (cfgPlanos?.valor) planos = JSON.parse(cfgPlanos.valor) } catch { /* usa default */ }
  planos = planos.filter(p => p.ativo)

  const nomePlataforma = cfgNome?.valor || 'Plataforma EAD White-Label'
  const descricaoHero = cfgDescricao?.valor || 'Sua associação com treinamentos, contratos e gestão de consultores em um único lugar — com sua marca, seu domínio, seu jeito.'
  const wppContato = cfgWpp?.valor?.replace(/\D/g, '') || ''

  return (
    <div style={{ minHeight: '100vh', background: '#08090d', color: '#f0f1f5', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid #252836', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, position: 'sticky', top: 0, background: '#08090dee', backdropFilter: 'blur(8px)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎓</div>
          <span style={{ fontWeight: 800, fontSize: 17 }}>{nomePlataforma}</span>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <a href="#planos" style={{ color: '#8a8fa3', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Planos</a>
          <a href="#recursos" style={{ color: '#8a8fa3', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Recursos</a>
          {wppContato && (
            <a href={`https://wa.me/${wppContato}`} target="_blank" rel="noreferrer"
              style={{ color: '#8a8fa3', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Contato</a>
          )}
          <Link href="/comecar" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', borderRadius: 8, padding: '8px 20px', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
            Começar agora
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '100px 24px 80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: '#6366f115', border: '1px solid #6366f140', borderRadius: 20, padding: '6px 16px', fontSize: 13, color: '#6366f1', fontWeight: 600, marginBottom: 24 }}>
          ✨ Plataforma White-Label para Associações
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1.1, marginBottom: 24, background: 'linear-gradient(135deg,#f0f1f5,#8a8fa3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Sua associação pronta<br />para o próximo nível
        </h1>
        <p style={{ fontSize: 20, color: '#8a8fa3', lineHeight: 1.6, maxWidth: 640, margin: '0 auto 40px' }}>
          {descricaoHero}
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/comecar" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', borderRadius: 10, padding: '16px 36px', textDecoration: 'none', fontSize: 17, fontWeight: 800, display: 'inline-block' }}>
            Quero minha plataforma →
          </Link>
          {wppContato && (
            <a href={`https://wa.me/${wppContato}?text=Olá! Quero saber mais sobre a plataforma.`} target="_blank" rel="noreferrer"
              style={{ background: 'transparent', color: '#f0f1f5', borderRadius: 10, padding: '16px 36px', textDecoration: 'none', fontSize: 17, fontWeight: 700, display: 'inline-block', border: '1px solid #252836' }}>
              💬 Falar no WhatsApp
            </a>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginTop: 72, flexWrap: 'wrap' }}>
          {[
            { num: '100%', label: 'White-Label' },
            { num: '24h', label: 'Setup completo' },
            { num: '∞', label: 'Módulos e aulas' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 36, fontWeight: 900, color: '#6366f1' }}>{s.num}</p>
              <p style={{ fontSize: 14, color: '#8a8fa3' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Tudo que sua associação precisa</h2>
          <p style={{ color: '#8a8fa3', fontSize: 17 }}>Uma plataforma completa, do treinamento à gestão financeira.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {FEATURES.map(f => (
            <div key={f.titulo} style={{ background: '#181b24', border: '1px solid #252836', borderRadius: 14, padding: '28px 24px' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{f.titulo}</h3>
              <p style={{ fontSize: 14, color: '#8a8fa3', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Planos */}
      <section id="planos" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Escolha seu plano</h2>
          <p style={{ color: '#8a8fa3', fontSize: 17 }}>Sem fidelidade. Cancele quando quiser.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(planos.length, 3)}, 1fr)`, gap: 24 }}>
          {planos.map(p => (
            <div key={p.id} style={{
              background: p.destaque ? 'linear-gradient(180deg,#6366f110,#181b24)' : '#181b24',
              border: p.destaque ? '2px solid #6366f1' : '1px solid #252836',
              borderRadius: 16, padding: '32px 28px', position: 'relative',
            }}>
              {p.destaque && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', borderRadius: 20, padding: '4px 16px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  ⭐ Mais popular
                </div>
              )}
              <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{p.nome}</h3>
              <p style={{ fontSize: 14, color: '#8a8fa3', marginBottom: 24 }}>{p.descricao}</p>
              <div style={{ marginBottom: 28 }}>
                {p.preco > 0 ? (
                  <>
                    <span style={{ fontSize: 13, color: '#8a8fa3' }}>R$ </span>
                    <span style={{ fontSize: 44, fontWeight: 900 }}>{p.preco.toLocaleString('pt-BR')}</span>
                    <span style={{ fontSize: 14, color: '#8a8fa3' }}>/mês</span>
                  </>
                ) : (
                  <span style={{ fontSize: 26, fontWeight: 800, color: '#6366f1' }}>{p.preco_label || 'Sob consulta'}</span>
                )}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {p.recursos.map(r => (
                  <li key={r} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14 }}>
                    <span style={{ color: '#02A153', flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ color: '#c9cce0' }}>{r}</span>
                  </li>
                ))}
              </ul>
              {p.preco > 0 ? (
                <Link href={`/comecar?plano=${p.id}`} style={{ display: 'block', background: p.destaque ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#252836', color: '#fff', borderRadius: 10, padding: '14px', textAlign: 'center', textDecoration: 'none', fontSize: 15, fontWeight: 700 }}>
                  Começar agora →
                </Link>
              ) : (
                <a href={wppContato ? `https://wa.me/${wppContato}?text=Quero saber sobre o plano ${p.nome}` : '#'}
                  target={wppContato ? '_blank' : undefined} rel="noreferrer"
                  style={{ display: 'block', background: '#252836', color: '#f0f1f5', borderRadius: 10, padding: '14px', textAlign: 'center', textDecoration: 'none', fontSize: 15, fontWeight: 700 }}>
                  Falar com consultor →
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '80px 24px 120px', textAlign: 'center' }}>
        <div style={{ background: '#181b24', border: '1px solid #252836', borderRadius: 20, padding: '60px 40px' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Pronto para começar?</h2>
          <p style={{ color: '#8a8fa3', fontSize: 16, marginBottom: 36 }}>Configure sua plataforma em menos de 24 horas. Sem contrato de fidelidade.</p>
          <Link href="/comecar" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', borderRadius: 10, padding: '18px 48px', textDecoration: 'none', fontSize: 18, fontWeight: 800, display: 'inline-block' }}>
            Criar minha plataforma →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #252836', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: '#8a8fa3', fontSize: 13 }}>
          Desenvolvido por <strong style={{ color: '#6366f1' }}>Oito7 Digital</strong> · Todos os direitos reservados
        </p>
      </footer>
    </div>
  )
}
