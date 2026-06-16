import { traduzirErro } from '@/lib/erros'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const aulasTable = (client: ReturnType<typeof createServiceRoleClient>) =>
  client.from('aulas_ao_vivo')

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const modo = searchParams.get('modo')
  const gestorId = searchParams.get('gestor_id')
  const alunoWhatsapp = searchParams.get('whatsapp')

  const adminClient = createServiceRoleClient()
  const db = aulasTable(adminClient)

  if (modo === 'admin') {
    const { data } = await db.select('*').is('gestor_id', null).order('data_hora')
    return NextResponse.json(data ?? [])
  }

  if (modo === 'gestor' && gestorId) {
    const { data } = await db.select('*').eq('gestor_id', gestorId).order('data_hora')
    return NextResponse.json(data ?? [])
  }

  if (alunoWhatsapp) {
    const wpp = alunoWhatsapp.replace(/\D/g, '')
    const { data: aluno } = await adminClient.from('alunos').select('gestor_whatsapp').eq('whatsapp', wpp).maybeSingle()

    let gestorIdAluno: string | null = null
    if (aluno?.gestor_whatsapp) {
      const { data: gestor } = await adminClient.from('gestores').select('id').eq('whatsapp', aluno.gestor_whatsapp).maybeSingle()
      gestorIdAluno = gestor?.id ?? null
    }

    const { data } = await db
      .select('*')
      .or(gestorIdAluno ? `gestor_id.is.null,gestor_id.eq.${gestorIdAluno}` : 'gestor_id.is.null')
      .gte('data_hora', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
      .order('data_hora')
    return NextResponse.json(data ?? [])
  }

  return NextResponse.json([])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { titulo, descricao, plataforma, link, data_hora, duracao_minutos, obrigatoria, gestor_id } = body

  if (!titulo || !plataforma || !link || !data_hora)
    return NextResponse.json({ error: 'Campos obrigatórios: título, plataforma, link, data/hora' }, { status: 400 })

  if (!['zoom', 'meet'].includes(plataforma))
    return NextResponse.json({ error: 'Plataforma inválida' }, { status: 400 })

  const adminClient = createServiceRoleClient()
  const { data, error } = await aulasTable(adminClient).insert({
    titulo, descricao: descricao || null, plataforma, link,
    data_hora: new Date(data_hora).toISOString(),
    duracao_minutos: duracao_minutos || 60,
    obrigatoria: !!obrigatoria,
    gestor_id: gestor_id || null,
  }).select().single()

  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const campos = Object.fromEntries(
    Object.entries(updates).filter(([k]) =>
      ['titulo', 'descricao', 'plataforma', 'link', 'data_hora', 'duracao_minutos', 'obrigatoria', 'gravacao_url'].includes(k)
    )
  ) as import('@/lib/database.types').Database['public']['Tables']['aulas_ao_vivo']['Update']

  const adminClient = createServiceRoleClient()
  const { data, error } = await aulasTable(adminClient).update(campos).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const adminClient = createServiceRoleClient()
  await aulasTable(adminClient).delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
