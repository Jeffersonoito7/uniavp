import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function getGestor() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createServiceRoleClient()
  const { data: gestor } = await (admin as any).from('gestores')
    .select('id, nome, painel_gestao')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .maybeSingle()
  if (!gestor?.painel_gestao) return null
  return { gestor, admin }
}

// GET: busca meta e resultados do mes
export async function GET(req: NextRequest) {
  const ctx = await getGestor()
  if (!ctx) return NextResponse.json({ error: 'Sem acesso' }, { status: 403 })
  const { gestor, admin } = ctx

  const mesParam = req.nextUrl.searchParams.get('mes') ?? new Date().toISOString().slice(0, 7)
  const mes = mesParam.length === 7 ? mesParam + '-01' : mesParam

  const [{ data: meta }, { data: resultados }] = await Promise.all([
    (admin as any).from('gestor_metas').select('*').eq('gestor_id', gestor.id).eq('mes', mes).maybeSingle(),
    (admin as any).from('gestor_equipe_resultados').select('*').eq('gestor_id', gestor.id).eq('mes', mes).order('nome_consultor'),
  ])

  return NextResponse.json({ meta, resultados: resultados ?? [] })
}

// POST: salva ou atualiza meta do mes
export async function POST(req: NextRequest) {
  const ctx = await getGestor()
  if (!ctx) return NextResponse.json({ error: 'Sem acesso' }, { status: 403 })
  const { gestor, admin } = ctx

  const body = await req.json()
  const mesRaw = body.mes ?? new Date().toISOString().slice(0, 7)
  const mes = mesRaw.length === 7 ? mesRaw + '-01' : mesRaw
  const meta_indicacoes = Number(body.meta_indicacoes ?? 0)

  const { data, error } = await (admin as any).from('gestor_metas')
    .upsert({ gestor_id: gestor.id, mes, meta_indicacoes, updated_at: new Date().toISOString() }, { onConflict: 'gestor_id,mes' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data })
}

// PUT: salva resultado de um consultor
export async function PUT(req: NextRequest) {
  const ctx = await getGestor()
  if (!ctx) return NextResponse.json({ error: 'Sem acesso' }, { status: 403 })
  const { gestor, admin } = ctx

  const body = await req.json()
  const { id, mes, nome_consultor, whatsapp_consultor, indicacoes, fechamentos, observacao } = body

  if (id) {
    // atualiza existente
    const { error } = await (admin as any).from('gestor_equipe_resultados')
      .update({ indicacoes, fechamentos, observacao, updated_at: new Date().toISOString() })
      .eq('id', id).eq('gestor_id', gestor.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    // insere novo
    const { error } = await (admin as any).from('gestor_equipe_resultados')
      .insert({ gestor_id: gestor.id, mes, nome_consultor, whatsapp_consultor, indicacoes, fechamentos, observacao })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// DELETE: remove um consultor da lista do mes
export async function DELETE(req: NextRequest) {
  const ctx = await getGestor()
  if (!ctx) return NextResponse.json({ error: 'Sem acesso' }, { status: 403 })
  const { gestor, admin } = ctx

  const { id } = await req.json()
  await (admin as any).from('gestor_equipe_resultados').delete().eq('id', id).eq('gestor_id', gestor.id)
  return NextResponse.json({ ok: true })
}
