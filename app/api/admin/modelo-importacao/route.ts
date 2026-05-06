import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([
    ['nome', 'whatsapp', 'email', 'senha'],
    ['João da Silva', '5587999990001', 'joao@email.com', 'Senha@123'],
  ])
  XLSX.utils.book_append_sheet(wb, ws, 'Consultores')
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="modelo-consultores.xlsx"',
    },
  })
}
