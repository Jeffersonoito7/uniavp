import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: aluno } = await (adminClient.from('alunos') as any).select('id').eq('user_id', user.id).maybeSingle()
  if (!aluno) return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })

  const { premio_id } = await req.json()
  if (!premio_id) return NextResponse.json({ error: 'premio_id obrigatório' }, { status: 400 })

  const { data: premio } = await (adminClient.from('premios') as any)
    .select('id, custo_pontos, quantidade_disponivel, ativo')
    .eq('id', premio_id)
    .maybeSingle()

  if (!premio || !premio.ativo) return NextResponse.json({ error: 'Prêmio não disponível' }, { status: 404 })

  const { data: pontosRows } = await (adminClient.from('aluno_pontos') as any)
    .select('quantidade')
    .eq('aluno_id', aluno.id)

  const saldo = (pontosRows ?? []).reduce((s: number, r: { quantidade: number }) => s + r.quantidade, 0)

  if (saldo < premio.custo_pontos) {
    return NextResponse.json({ error: `Saldo insuficiente. Você tem ${saldo} pontos, precisa de ${premio.custo_pontos}.` }, { status: 400 })
  }

  if (premio.quantidade_disponivel !== null && premio.quantidade_disponivel <= 0) {
    return NextResponse.json({ error: 'Prêmio esgotado.' }, { status: 400 })
  }

  const { data: resgate } = await (adminClient.from('resgates') as any)
    .insert({ aluno_id: aluno.id, premio_id, status: 'pendente' })
    .select('id')
    .single()

  await (adminClient.from('aluno_pontos') as any).insert({
    aluno_id: aluno.id,
    quantidade: -premio.custo_pontos,
    motivo: `Resgate prêmio ${premio_id}`,
  })

  if (premio.quantidade_disponivel !== null) {
    await (adminClient.from('premios') as any)
      .update({ quantidade_disponivel: premio.quantidade_disponivel - 1 })
      .eq('id', premio_id)
  }

  const saldo_restante = saldo - premio.custo_pontos

  return NextResponse.json({ ok: true, saldo_restante, id: resgate?.id })
}
