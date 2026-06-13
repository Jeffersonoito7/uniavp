import { createServiceRoleClient } from '@/lib/supabase-server'
import SignupForm from './SignupForm'
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
 recursos: ['Tudo do Profissional', 'Painel PRO para gestores', 'Consultores ilimitados', 'Domínio próprio incluso', 'Suporte prioritário', 'Treinamento da equipe'],
 },
]

export default async function ComecarPage({ searchParams }: { searchParams?: { plano?: string } }) {
 const adminClient = createServiceRoleClient()
 const { data: cfgPlanos } = await adminClient.from('configuracoes')
 .select('valor').eq('chave', 'planos_saas').maybeSingle()

 let planos: PlanoSaaS[] = PLANOS_DEFAULT
 try { if (cfgPlanos?.valor) planos = JSON.parse(String(cfgPlanos.valor)) } catch { /* usa default */ }

 // Filtra apenas planos ativos com preço definido (exclui "sob consulta")
 const planosAtivos = planos.filter(p => p.ativo && p.preco> 0)

 // Se não há planos com preço, mostra todos ativos
 const planosExibir = planosAtivos.length> 0 ? planosAtivos : planos.filter(p => p.ativo)

 const planoInicial = searchParams?.plano && planosExibir.find(p => p.id === searchParams.plano)
 ? searchParams.plano : undefined

 return <SignupForm planos={planosExibir} planoInicial={planoInicial} />
}
