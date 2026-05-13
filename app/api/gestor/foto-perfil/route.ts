import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: gestor } = await (adminClient.from('gestores') as any)
    .select('id').eq('user_id', user.id).maybeSingle()
  if (!gestor) return NextResponse.json({ error: 'Gestor não encontrado' }, { status: 404 })

  const formData = await req.formData()
  const foto = formData.get('foto') as File | null
  if (!foto) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })

  const ext = foto.name.split('.').pop() ?? 'jpg'
  const path = `gestores/${gestor.id}/${Date.now()}.${ext}`

  const { error: uploadError } = await adminClient.storage
    .from('avatares').upload(path, foto, { upsert: true, contentType: foto.type })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 })

  const { data: { publicUrl } } = adminClient.storage.from('avatares').getPublicUrl(path)

  await (adminClient.from('gestores') as any).update({ foto_perfil: publicUrl }).eq('id', gestor.id)

  return NextResponse.json({ url: publicUrl })
}
