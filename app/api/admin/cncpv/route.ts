import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// PATCH /api/admin/cncpv — revogar ou reativar carteira
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { numero_registro, acao, motivo } = await req.json()
  if (!numero_registro || !acao) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  if (acao === 'revogar') {
    const { error } = await (adminClient.from('cncpv_assinaturas') as any)
      .update({ status: 'revogada', revogado_em: new Date().toISOString(), revogado_motivo: motivo || 'Revogado pelo administrador' })
      .eq('numero_registro', numero_registro)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, status: 'revogada' })
  }

  if (acao === 'reativar') {
    const { error } = await (adminClient.from('cncpv_assinaturas') as any)
      .update({ status: 'ativa', revogado_em: null, revogado_motivo: null })
      .eq('numero_registro', numero_registro)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, status: 'ativa' })
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
