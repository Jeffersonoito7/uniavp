import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { aulaId, alunoId, nota, comentario } = await req.json()
  if (!nota || nota < 1 || nota > 5) return NextResponse.json({ error: 'Nota inválida' }, { status: 400 })

  const adminClient = createServiceRoleClient()
  await (adminClient.from('reacoes_aula') as any)
    .upsert({ aula_id: aulaId, aluno_id: alunoId, nota, comentario: comentario || '' }, { onConflict: 'aluno_id,aula_id' })

  return NextResponse.json({ ok: true })
}
