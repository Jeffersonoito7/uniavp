import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// GET /api/admin/diagnostico-modulos
// Retorna todos os modulos com seus tenant_ids e todos os admins com seus tenant_ids
// Usado para diagnosticar problemas de visibilidade entre contas
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()

  // Verifica se e admin ou super admin
  const [{ data: adminRec }, { data: superRec }] = await Promise.all([
    adminClient.from('admins').select('id, nome, tenant_id, role').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
    adminClient.from('super_admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
  ])
  if (!adminRec && !superRec) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const [{ data: todosAdmins }, { data: todosModulos }] = await Promise.all([
    adminClient.from('admins').select('id, nome, email, tenant_id, role, ativo').order('nome'),
    adminClient.from('modulos').select('id, titulo, tenant_id, publicado, ordem').order('ordem'),
  ])

  return NextResponse.json({
    eu: adminRec ?? { id: null, nome: 'super_admin', tenant_id: null, role: 'super_admin' },
    admins: todosAdmins ?? [],
    modulos: todosModulos ?? [],
  })
}
