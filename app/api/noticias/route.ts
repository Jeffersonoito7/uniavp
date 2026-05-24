import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([])

  const adminClient = createServiceRoleClient()
  const { data } = await adminClient.from('noticias')
    .select('*').eq('publicado', true).order('created_at', { ascending: false }).limit(20)

  return NextResponse.json(data ?? [])
}
