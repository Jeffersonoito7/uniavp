import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getSiteConfig } from '@/lib/site-config'
import { headers } from 'next/headers'

export default async function UpgradePage() {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) redirect('/entrar?p=free')

 const adminClient = createServiceRoleClient()
 const { data: aluno } = await adminClient.from('alunos')
 .select('id, nome, whatsapp').eq('user_id', user.id).maybeSingle()
 if (!aluno) redirect('/entrar?p=free')

 // Se já é PRO ativo, redireciona direto
 const { data: gestorAtivo } = await adminClient.from('gestores')
 .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
 if (gestorAtivo) redirect('/pro')

 const host = (await headers()).get('host') ?? ''
 const config = await getSiteConfig(host)
 const nomeSite = config.nome || 'Universidade'
 const nomeFree = `${nomeSite} FREE`
 const nomePro = `${nomeSite} PRO`

 const beneficios = [
 { icon: '', titulo: 'Módulos ilimitados', desc: 'Acesse todos os módulos da plataforma sem restrições' },
 { icon: '', titulo: 'Gerencie sua equipe', desc: 'Cadastre, acompanhe e reengaje consultores da sua equipe' },
 { icon: '', titulo: 'Links de captação', desc: 'Links personalizados para captar novos consultores' },
 { icon: '', titulo: 'Relatórios e métricas', desc: 'Veja o progresso da equipe, inativos e progresso médio' },
 { icon: '', titulo: 'WhatsApp direto', desc: 'Envie mensagens para consultores diretamente do painel' },
 { icon: '', titulo: 'Templates de arte', desc: 'Crie e personalize artes para sua equipe compartilhar' },
 { icon: '', titulo: 'Indicações ilimitadas', desc: `Indique sem limite — no plano ${nomeFree} o limite é 20` },
 { icon: '', titulo: 'Carteira de Formação', desc: 'Certificado e carteirinha para sua equipe' },
 ]

 return (
 <div style={{ minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>
 {/* Header */}
 <header style={{ background: 'var(--avp-card)', borderBottom: '1px solid var(--avp-border)', padding: '0 24px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
 <a href={`/aluno/${aluno.whatsapp}`} style={{ color: 'var(--avp-text-dim)', textDecoration: 'none', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
 ← Voltar
 </a>
 <span style={{ fontWeight: 800, fontSize: 15 }}> Faça Upgrade</span>
 <div />
 </header>

 <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(24px, 5vw, 48px) 20px 60px' }}>

 {/* Hero */}
 <div style={{ textAlign: 'center', marginBottom: 40 }}>
 <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(79,70,229,0.25)', borderRadius: 100, padding: '6px 18px', fontSize: 12, fontWeight: 700, color: '#818cf8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 20 }}>
 {nomePro}
 </div>
 <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
 Você chegou ao limite do<br />
 <span style={{ color: '#818cf8' }}>{nomeFree}</span>
 </h1>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 16, lineHeight: 1.7, maxWidth: 480, margin: '0 auto' }}>
 No <strong style={{ color: 'var(--avp-text)' }}>{nomeFree}</strong> você acessa módulos limitados.
 Faça upgrade para o <strong style={{ color: '#818cf8' }}>{nomePro}</strong> e desbloqueie tudo — sem limites.
 </p>
 </div>

 {/* Comparativo Free vs Pro */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 36 }}>
 {/* Free */}
 <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 24 }}>
 <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--avp-text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{nomeFree}</p>
 <p style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>Grátis</p>
 {[
 ' Módulos limitados',
 ' Indicar até 20 pessoas',
 ' Gestão de equipe',
 ' Módulos ilimitados',
 ' Relatórios',
 ].map(item => (
 <p key={item} style={{ fontSize: 13, color: item.startsWith('') ? 'var(--avp-text-dim)' : 'var(--avp-text)', marginBottom: 6, opacity: item.startsWith('') ? 0.5 : 1 }}>{item}</p>
 ))}
 </div>
 {/* Pro */}
 <div style={{ background: 'rgba(79,70,229,0.08)', border: '2px solid rgba(79,70,229,0.35)', borderRadius: 16, padding: 24, position: 'relative' }}>
 <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#4f46e5', borderRadius: 100, padding: '4px 16px', fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
 RECOMENDADO
 </div>
 <p style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{nomePro}</p>
 <p style={{ fontSize: 28, fontWeight: 900, marginBottom: 16, color: '#818cf8' }}>Mensal</p>
 {[
 ' Módulos ilimitados',
 ' Indicações ilimitadas',
 ' Gestão de equipe',
 ' Relatórios e métricas',
 ' Templates de arte',
 ].map(item => (
 <p key={item} style={{ fontSize: 13, color: '#c4b5fd', marginBottom: 6 }}>{item}</p>
 ))}
 </div>
 </div>

 {/* Benefícios */}
 <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: '24px 28px', marginBottom: 32 }}>
 <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 20 }}> Tudo que você ganha no {nomePro}</p>
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
 <a href="/assinar-pro" className="btn btn-primary" style={{ textDecoration: 'none', marginBottom: 12, fontSize: 18, borderRadius: 14, padding: '18px 48px' }}>
 Quero ser {nomePro}
 </a>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginTop: 10 }}>
 Você terá acesso imediato a todos os módulos e ao painel de gestão.
 </p>
 <a href={`/aluno/${aluno.whatsapp}`} style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 16, textDecoration: 'none' }}>
 Voltar para meus módulos →
 </a>
 </div>
 </div>
 </div>
 )
}
