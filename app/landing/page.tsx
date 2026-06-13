import { createServiceRoleClient } from '@/lib/supabase-server'
import Link from 'next/link'
import type { PlanoSaaS } from '@/app/api/super/planos/route'

export const dynamic = 'force-dynamic'

const PLANOS_DEFAULT: PlanoSaaS[] = [
 { id: 'starter', nome: 'Starter', descricao: 'Para associações em crescimento', preco: 0, gestor_ativo: false, limite_consultores: 100, destaque: false, ativo: true, recursos: ['Módulos e aulas ilimitadas', 'Área do membro', 'Painel admin completo', 'Quiz e certificados', 'Contratos digitais', 'Suporte por WhatsApp'] },
 { id: 'profissional', nome: 'Profissional', descricao: 'Para associações consolidadas', preco: 0, gestor_ativo: false, limite_consultores: 500, destaque: true, ativo: true, recursos: ['Tudo do Starter', 'Até 500 membros', 'Ranking e gamificação', 'Artes para redes sociais', 'Relatórios avançados', 'Onboarding guiado'] },
 { id: 'enterprise', nome: 'Enterprise', descricao: 'Para grandes operações', preco: 0, gestor_ativo: true, limite_consultores: 9999, destaque: false, ativo: true, recursos: ['Tudo do Profissional', 'Painel para líderes de equipe', 'Membros ilimitados', 'Domínio próprio incluso', 'Suporte prioritário', 'Treinamento da equipe'] },
]

const FEATURES = [
 {
 titulo: 'Treinamentos e módulos',
 desc: 'Monte cursos completos com vídeos, PDFs e quizzes. Acompanhe o progresso individual de cada membro.',
 svg: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-1.478" /></svg>,
 },
 {
 titulo: 'Contratos com validade jurídica',
 desc: 'Membros assinam contratos online com hash SHA-256. PDF gerado automaticamente e enviado por WhatsApp.',
 svg: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>,
 },
 {
 titulo: 'Ranking e certificados',
 desc: 'Gamificação que engaja. Certificados emitidos automaticamente ao concluir módulos.',
 svg: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" /></svg>,
 },
 {
 titulo: 'Dois níveis de acesso',
 desc: 'Membros FREE acessam os treinamentos. Usuários PRO têm painel próprio para gerenciar equipes.',
 svg: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>,
 },
 {
 titulo: 'Marca própria — white-label',
 desc: 'Sua logo, suas cores, seu domínio. Seus membros não sabem que é uma plataforma terceirizada.',
 svg: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" /></svg>,
 },
 {
 titulo: 'WhatsApp integrado',
 desc: 'Notificações, contratos, cobranças e avisos enviados automaticamente no WhatsApp dos membros.',
 svg: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>,
 },
]

export default async function LandingPage() {
 const adminClient = createServiceRoleClient()
 const [cfgPlanos, cfgNome, cfgDescricao, cfgWpp] = await Promise.all([
 adminClient.from('configuracoes').select('valor').eq('chave', 'planos_saas').maybeSingle(),
 adminClient.from('configuracoes').select('valor').eq('chave', 'landing_nome_plataforma').maybeSingle(),
 adminClient.from('configuracoes').select('valor').eq('chave', 'landing_descricao').maybeSingle(),
 adminClient.from('configuracoes').select('valor').eq('chave', 'landing_whatsapp_contato').maybeSingle(),
 ])

 let planos: PlanoSaaS[] = PLANOS_DEFAULT
 try { if (cfgPlanos.data?.valor) planos = JSON.parse(String(cfgPlanos.data.valor)) } catch { /* usa default */ }
 planos = planos.filter(p => p.ativo)

 const nomePlataforma = String(cfgNome.data?.valor || '') || 'Plataforma EAD'
 const descricaoHero = String(cfgDescricao.data?.valor || '') || 'Treinamentos, contratos digitais e gestão de membros em um único lugar — com sua marca, seu domínio, do seu jeito.'
 const wppContato = String(cfgWpp.data?.valor || '').replace(/\D/g, '')

 const navLink: React.CSSProperties = { color: '#64748b', textDecoration: 'none', fontSize: 14, fontWeight: 500 }

 return (
 <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f1f5f9', fontFamily: '"Inter", -apple-system, sans-serif' }}>

 {/* Header */}
 <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #1e1f2e', background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)', padding: '0 48px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
 <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: -0.3, color: '#f1f5f9' }}>{nomePlataforma}</span>
 <nav style={{ display: 'flex', gap: 24 }}>
 <a href="#recursos" style={navLink}>Recursos</a>
 <a href="#planos" style={navLink}>Planos</a>
 {wppContato && <a href={`https://wa.me/${wppContato}`} target="_blank" rel="noreferrer" style={navLink}>Contato</a>}
 </nav>
 </div>
 <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
 <Link href="/login" className="btn btn-ghost" style={{ textDecoration: 'none' }}>Entrar</Link>
 <Link href="/comecar" className="btn btn-primary" style={{ textDecoration: 'none' }}>Começar agora</Link>
 </div>
 </header>

 {/* Hero */}
 <section style={{ maxWidth: 820, margin: '0 auto', padding: '120px 32px 100px', textAlign: 'center' }}>
 <div style={{ display: 'inline-block', background: '#1e1b4b', color: '#a5b4fc', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 28 }}>
 White-Label para Associações
 </div>
 <h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1.5, marginBottom: 20, color: '#f1f5f9' }}>
 A plataforma que sua<br />associação precisava
 </h1>
 <p style={{ fontSize: 18, color: '#64748b', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 40px' }}>{descricaoHero}</p>
 <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
 <Link href="/comecar" className="btn btn-primary" style={{ textDecoration: 'none', padding: '13px 28px', fontSize: 15 }}>
 Criar minha plataforma
 </Link>
 {wppContato && (
 <a href={`https://wa.me/${wppContato}?text=Quero saber mais sobre a plataforma.`} target="_blank" rel="noreferrer"
 className="btn btn-ghost" style={{ textDecoration: 'none', padding: '13px 28px', fontSize: 15 }}>
 Falar com a equipe
 </a>
 )}
 </div>

 {/* Stats */}
 <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 72, borderTop: '1px solid #1e1f2e', paddingTop: 48 }}>
 {[
 { num: '100%', label: 'White-label' },
 { num: '< 24h', label: 'Setup completo' },
 { num: 'Ilimitado', label: 'Módulos e aulas' },
 ].map((s, i) => (
 <div key={s.label} style={{ textAlign: 'center', flex: 1, ...(i> 0 ? { borderLeft: '1px solid #1e1f2e' } : {}) }}>
 <p style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', letterSpacing: -0.5, marginBottom: 4 }}>{s.num}</p>
 <p style={{ fontSize: 13, color: '#64748b' }}>{s.label}</p>
 </div>
 ))}
 </div>
 </section>

 {/* Recursos */}
 <section id="recursos" style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 32px' }}>
 <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: '#4f46e5', textTransform: 'uppercase', marginBottom: 12 }}>Recursos</p>
 <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: -0.8, marginBottom: 12, color: '#f1f5f9' }}>Tudo que sua associação precisa</h2>
 <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.6 }}>Uma plataforma completa, do treinamento ao contrato digital.</p>
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, border: '1px solid #1e1f2e', borderRadius: 12, overflow: 'hidden', marginTop: 48 }}>
 {FEATURES.map((f, i) => (
 <div key={f.titulo} style={{ background: '#0f0f17', padding: '28px 26px', borderRight: (i + 1) % 3 === 0 ? 'none' : '1px solid #1e1f2e', borderBottom: i>= 3 ? 'none' : '1px solid #1e1f2e' }}>
 <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1e1b4b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: '#818cf8' }}>{f.svg}</div>
 <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#e2e8f0' }}>{f.titulo}</h3>
 <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{f.desc}</p>
 </div>
 ))}
 </div>
 </section>

 {/* Planos */}
 <section id="planos" style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 32px', borderTop: '1px solid #1e1f2e' }}>
 <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: '#4f46e5', textTransform: 'uppercase', marginBottom: 12 }}>Planos</p>
 <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: -0.8, marginBottom: 12, color: '#f1f5f9' }}>Simples e transparente</h2>
 <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.6 }}>Sem fidelidade. Cancele quando quiser.</p>
 <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(planos.length, 3)}, 1fr)`, gap: 1, border: '1px solid #1e1f2e', borderRadius: 12, overflow: 'hidden', marginTop: 48 }}>
 {planos.map((p, i) => (
 <div key={p.id} style={{ background: '#0f0f17', padding: '32px 28px', position: 'relative', borderRight: i < planos.length - 1 ? '1px solid #1e1f2e' : 'none', borderTop: p.destaque ? '2px solid #4f46e5' : undefined }}>
 {p.destaque && (
 <div style={{ position: 'absolute', top: -1, left: 20, background: '#4f46e5', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: '0 0 6px 6px', letterSpacing: 0.5 }}>
 MAIS POPULAR
 </div>
 )}
 <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6, letterSpacing: 0.3 }}>{p.nome.toUpperCase()}</p>
 <p style={{ fontSize: 13, color: '#475569', marginBottom: 24, lineHeight: 1.5 }}>{p.descricao}</p>
 <div style={{ marginBottom: 28 }}>
 {p.preco> 0 ? (
 <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
 <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>R$</span>
 <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1, color: '#f1f5f9' }}>{p.preco.toLocaleString('pt-BR')}</span>
 <span style={{ fontSize: 13, color: '#64748b' }}>/mês</span>
 </div>
 ) : (
 <p style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>{p.preco_label || 'Sob consulta'}</p>
 )}
 </div>
 <div style={{ borderTop: '1px solid #1e1f2e', paddingTop: 24, marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
 {p.recursos.map(r => (
 <div key={r} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
 <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
 <circle cx="8" cy="8" r="8" fill="#1e1b4b" />
 <path d="M5 8l2 2 4-4" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
 </svg>
 <span style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.4 }}>{r}</span>
 </div>
 ))}
 </div>
 {p.preco> 0 ? (
 <Link href={`/comecar?plano=${p.id}`}
 className="btn btn-full"
 style={{ background: p.destaque ? '#4f46e5' : '#1e1f2e', textDecoration: 'none' }}>
 Começar com {p.nome}
 </Link>
 ) : (
 <a href={wppContato ? `https://wa.me/${wppContato}?text=Quero saber sobre o plano ${p.nome}` : '#'}
 target={wppContato ? '_blank' : undefined} rel="noreferrer"
 className="btn btn-ghost btn-full" style={{ textDecoration: 'none' }}>
 Falar com a equipe
 </a>
 )}
 </div>
 ))}
 </div>
 </section>

 {/* CTA */}
 <section style={{ borderTop: '1px solid #1e1f2e', padding: '96px 32px', textAlign: 'center' }}>
 <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#4f46e5', textTransform: 'uppercase', marginBottom: 20 }}>Pronto para começar</p>
 <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -0.8, marginBottom: 16, color: '#f1f5f9' }}>
 Configure em menos de 24 horas
 </h2>
 <p style={{ fontSize: 16, color: '#64748b', marginBottom: 36 }}>Sem contrato de fidelidade. Cancele quando quiser.</p>
 <Link href="/comecar" className="btn btn-primary" style={{ textDecoration: 'none', padding: '14px 32px', fontSize: 15 }}>
 Criar minha plataforma
 </Link>
 </section>

 {/* Footer */}
 <footer style={{ borderTop: '1px solid #1e1f2e', padding: '28px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <p style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>{nomePlataforma}</p>
 <p style={{ fontSize: 12, color: '#334155' }}>Desenvolvido por Oito7 Digital</p>
 </footer>
 </div>
 )
}
