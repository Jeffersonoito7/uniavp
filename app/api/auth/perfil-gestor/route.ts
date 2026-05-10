import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// Verifica APENAS se o usuário logado é gestor — não verifica admin/aluno
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ tipo: null })

  const admin = createServiceRoleClient()
  const { data: gestorRecord } = await (admin.from('gestores') as any)
    .select('id, ativo').eq('user_id', user.id).maybeSingle()

  if (!gestorRecord) return NextResponse.json({ tipo: null })
  if (!gestorRecord.ativo) return NextResponse.json({ tipo: 'gestor_inativo' })
  return NextResponse.json({ tipo: 'gestor', redirect: '/gestor' })
}
