import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  const { data: superRecord } = await (adminClient.from('super_admins') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord && !superRecord) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const bucket = (formData.get('bucket') as string) || 'artes'
  const path = formData.get('path') as string

  if (!file || !path) return NextResponse.json({ error: 'Arquivo ou caminho ausente' }, { status: 400 })

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error } = await adminClient.storage.from(bucket).upload(path, buffer, {
    upsert: true,
    contentType: file.type,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = adminClient.storage.from(bucket).getPublicUrl(path)
  // Cache-buster: força CDN a servir a versão recém-enviada em vez da cacheada
  const url = `${publicUrl}?v=${Date.now()}`
  return NextResponse.json({ url })
}
