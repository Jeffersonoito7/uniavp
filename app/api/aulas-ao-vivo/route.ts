import { traduzirErro } from '@/lib/erros'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'

export const dynamic = 'force-dynamic'

const aulasTable = (client: ReturnType<typeof createServiceRoleClient>) =>
  client.from('aulas_ao_vivo')

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const modo = searchParams.get('modo')
  const gestorId = searchParams.get('gestor_id')
  const alunoWhatsapp = searchParams.get('whatsapp')

  const adminClient = createServiceRoleClient()
  const db = aulasTable(adminClient)

  if (modo === 'admin') {
    // Apenas admins autenticados podem listar aulas no modo admin
    const ctx = await getAdminContext(user.id, adminClient)
    if (!ctx) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    // Filtra pelo tenant do admin; super_admin ve todas
    let q = db.select('*').is('gestor_id', null).order('data_hora')
    if (ctx.tenantId) q = (q as any).eq('tenant_id', ctx.tenantId)
    const { data } = await q
    return NextResponse.json(data ?? [])
  }

  if (modo === 'gestor' && gestorId) {
    // Verifica que o usuario logado e o proprio gestor solicitado
    const { data: gestor } = await adminClient.from('gestores')
      .select('id, tenant_id')
      .eq('user_id', user.id)
      .eq('id', gestorId)
      .eq('ativo', true)
      .maybeSingle()
    if (!gestor) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    const { data } = await db.select('*').eq('gestor_id', gestorId).order('data_hora')
    return NextResponse.json(data ?? [])
  }

  if (alunoWhatsapp) {
    const wpp = alunoWhatsapp.replace(/\D/g, '')
    // Verifica que o usuario logado e o proprio aluno desse whatsapp
    const { data: aluno } = await adminClient.from('alunos')
      .select('gestor_whatsapp, user_id')
      .eq('whatsapp', wpp)
      .maybeSingle()
    if (!aluno || aluno.user_id !== user.id) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

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

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const body = await req.json()
  const { titulo, descricao, plataforma, link, data_hora, duracao_minutos, obrigatoria, gestor_id } = body

  if (!titulo || !plataforma || !link || !data_hora)
    return NextResponse.json({ error: 'Campos obrigatórios: título, plataforma, link, data/hora' }, { status: 400 })

  if (!['zoom', 'meet'].includes(plataforma))
    return NextResponse.json({ error: 'Plataforma inválida' }, { status: 400 })

  const { data, error } = await (aulasTable(adminClient) as any).insert({
    titulo, descricao: descricao || null, plataforma, link,
    data_hora: new Date(data_hora).toISOString(),
    duracao_minutos: duracao_minutos || 60,
    obrigatoria: !!obrigatoria,
    gestor_id: gestor_id || null,
    ...(ctx.tenantId ? { tenant_id: ctx.tenantId } : {}),
  }).select().single()

  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const campos = Object.fromEntries(
    Object.entries(updates).filter(([k]) =>
      ['titulo', 'descricao', 'plataforma', 'link', 'data_hora', 'duracao_minutos', 'obrigatoria', 'gravacao_url'].includes(k)
    )
  ) as import('@/lib/database.types').Database['public']['Tables']['aulas_ao_vivo']['Update']

  // Valida escopo: admin so edita aula do seu tenant
  let selQ = adminClient.from('aulas_ao_vivo').select('id').eq('id', id)
  if (ctx.tenantId) selQ = (selQ as any).eq('tenant_id', ctx.tenantId)
  const { data: alvo } = await selQ.maybeSingle()
  if (!alvo) return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 })

  const { data, error } = await aulasTable(adminClient).update(campos).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  // Valida escopo: admin so deleta aula do seu tenant
  let selQ = adminClient.from('aulas_ao_vivo').select('id').eq('id', id)
  if (ctx.tenantId) selQ = (selQ as any).eq('tenant_id', ctx.tenantId)
  const { data: alvo } = await selQ.maybeSingle()
  if (!alvo) return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 })

  await aulasTable(adminClient).delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
