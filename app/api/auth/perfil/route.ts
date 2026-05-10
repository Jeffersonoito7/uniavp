import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// Retorna o perfil do usuário logado: tipo e redirect
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ tipo: null })

  const admin = createServiceRoleClient()

  const { data: adminRecord } = await (admin.from('admins') as any)
    .select('id, role').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (adminRecord) return NextResponse.json({ tipo: 'admin', redirect: '/admin' })

  const { data: superRecord } = await (admin.from('super_admins') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (superRecord) return NextResponse.json({ tipo: 'super', redirect: '/super' })

  const { data: gestorRecord } = await (admin.from('gestores') as any)
    .select('id, ativo').eq('user_id', user.id).maybeSingle()
  if (gestorRecord) {
    if (!gestorRecord.ativo) return NextResponse.json({ tipo: 'gestor_inativo' })
    return NextResponse.json({ tipo: 'gestor', redirect: '/gestor' })
  }

  const { data: alunoRecord } = await (admin.from('alunos') as any)
    .select('whatsapp').eq('user_id', user.id).maybeSingle()
  if (alunoRecord?.whatsapp) return NextResponse.json({ tipo: 'aluno', redirect: `/aluno/${alunoRecord.whatsapp}` })

  return NextResponse.json({ tipo: null })
}
