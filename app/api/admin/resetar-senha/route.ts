import { traduzirErro } from '@/lib/erros'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await adminClient.from('admins')
    .select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { user_id, nova_senha } = await req.json()
  if (!user_id || !nova_senha || nova_senha.length < 6)
    return NextResponse.json({ error: 'user_id e nova_senha (mín. 6 caracteres) são obrigatórios' }, { status: 400 })

  // Verifica se o user_id pertence a um aluno ou gestor do tenant do admin
  // Impede que admin de tenant A resete senha de usuários de outros tenants
  if (adminRecord.tenant_id) {
    const [{ data: alunoDoTenant }, { data: gestorDoTenant }] = await Promise.all([
      adminClient.from('alunos').select('id').eq('user_id', user_id).eq('tenant_id', adminRecord.tenant_id).maybeSingle(),
      adminClient.from('gestores').select('id').eq('user_id', user_id).eq('tenant_id', adminRecord.tenant_id).maybeSingle(),
    ])
    if (!alunoDoTenant && !gestorDoTenant)
      return NextResponse.json({ error: 'Sem permissão para redefinir a senha deste usuário' }, { status: 403 })
  }

  const { error } = await adminClient.auth.admin.updateUserById(user_id, { password: nova_senha })
  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 400 })

  return NextResponse.json({ ok: true })
}
