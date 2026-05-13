import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createServiceRoleClient()
  const { data: gestor } = await (admin.from('gestores') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!gestor) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { data: modulos } = await (admin.from('modulos') as any)
    .select('id, titulo, ordem, descricao, capa_url').order('ordem')

  const { data: aulas } = await (admin.from('aulas') as any)
    .select('id, titulo, descricao, youtube_video_id, video_url, duracao_minutos, capa_url, ordem, modulo_id, publicado')
    .order('ordem')

  return NextResponse.json({ modulos: modulos ?? [], aulas: aulas ?? [] })
}
