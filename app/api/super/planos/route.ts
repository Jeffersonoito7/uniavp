import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export type PlanoSaaS = {
  id: string
  nome: string
  descricao: string
  preco: number
  preco_label?: string
  gestor_ativo: boolean
  limite_consultores: number
  destaque: boolean
  ativo: boolean
  recursos: string[]
}

const PLANOS_DEFAULT: PlanoSaaS[] = [
  {
    id: 'starter', nome: 'Starter', descricao: 'Ideal para associações em crescimento',
    preco: 0, gestor_ativo: false, limite_consultores: 100, destaque: false, ativo: true,
    recursos: ['Módulos e aulas ilimitadas', 'Área do consultor (FREE)', 'Painel admin completo', 'Quiz e certificados', 'Contratos digitais', 'Suporte por WhatsApp'],
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

async function isSuperAdmin(userId: string, adminClient: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await adminClient.from('super_admins').select('id').eq('user_id', userId).eq('ativo', true).maybeSingle()
  return !!data
}

export async function GET() {
  const adminClient = createServiceRoleClient()
  const { data } = await adminClient.from('configuracoes')
    .select('valor').eq('chave', 'planos_saas').maybeSingle()
  try {
    if (data?.valor) return NextResponse.json(JSON.parse(String(data.valor)))
  } catch { /* usa default */ }
  return NextResponse.json(PLANOS_DEFAULT)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  if (!await isSuperAdmin(user.id, adminClient)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const planos: PlanoSaaS[] = await req.json()
  if (!Array.isArray(planos)) return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })

  await adminClient.from('configuracoes').upsert(
    { chave: 'planos_saas', valor: JSON.stringify(planos), descricao: 'Planos SaaS da plataforma' },
    { onConflict: 'chave' }
  )
  return NextResponse.json({ ok: true })
}
