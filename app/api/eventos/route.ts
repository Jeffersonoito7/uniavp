import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data } = await (adminClient.from('eventos') as any)
    .select('*')
    .order('data_hora')

  return NextResponse.json(data ?? [])
}
