import { traduzirErro } from '@/lib/erros'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { aluno_id, nome, bio, link_externo, indicador_whatsapp, cpf } = await req.json()

  if (!aluno_id) return NextResponse.json({ error: 'aluno_id obrigatório' }, { status: 400 })

  const { data: aluno } = await adminClient.from('alunos')
    .select('id, user_id, nome, whatsapp, indicador_id, tenant_id')
    .eq('id', aluno_id)
    .maybeSingle()

  if (!aluno || aluno.user_id !== user.id) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  // Só atualiza indicador se não houver um já definido (imutável após salvo)
  if (indicador_whatsapp !== undefined) {
    if (aluno.indicador_id) {
      return NextResponse.json({ error: 'Indicador já registrado e não pode ser alterado.' }, { status: 400 })
    }
    const wpp = String(indicador_whatsapp).replace(/\D/g, '')
    if (wpp === aluno.whatsapp.replace(/\D/g, '')) {
      return NextResponse.json({ error: 'Você não pode se indicar.' }, { status: 400 })
    }

    // Busca o aluno-indicador pelo whatsapp no mesmo tenant
    let alunoIndQuery = adminClient.from('alunos').select('id, nome, email, whatsapp').eq('whatsapp', wpp)
    if (aluno.tenant_id) alunoIndQuery = alunoIndQuery.eq('tenant_id', aluno.tenant_id)
    const { data: alunoInd } = await alunoIndQuery.maybeSingle()

    if (!alunoInd) {
      return NextResponse.json({ error: 'Não encontramos nenhum membro cadastrado com esse WhatsApp.' }, { status: 404 })
    }

    // Busca ou cria registro em indicadores
    const { data: indExistente } = await adminClient.from('indicadores')
      .select('id').eq('whatsapp', wpp).maybeSingle()

    let indicadorId: string
    if (indExistente) {
      indicadorId = indExistente.id
    } else {
      const { data: indNovo, error: indErr } = await adminClient.from('indicadores')
        .insert({ nome: alunoInd.nome, tipo: 'consultor', whatsapp: wpp, email: alunoInd.email ?? null, ...(aluno.tenant_id ? { tenant_id: aluno.tenant_id } : {}) })
        .select('id').single()
      if (indErr || !indNovo) return NextResponse.json({ error: 'Erro ao registrar indicador.' }, { status: 500 })
      indicadorId = indNovo.id
    }

    // Verifica limite de 20 indicações para free
    const { count: jaIndicou } = await adminClient.from('alunos')
      .select('id', { count: 'exact', head: true })
      .eq('indicador_id', indicadorId)
    if ((jaIndicou ?? 0) >= 20) {
      return NextResponse.json({ error: 'Este membro já atingiu o limite de indicações.' }, { status: 400 })
    }

    const { error } = await adminClient.from('alunos').update({ indicador_id: indicadorId }).eq('id', aluno_id)
    if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 400 })

    return NextResponse.json({ ok: true, indicador: { nome: alunoInd.nome, whatsapp: wpp } })
  }

  const cpfLimpo = cpf !== undefined ? (cpf?.replace(/\D/g, '') || null) : undefined

  const { error } = await adminClient.from('alunos')
    .update({ nome: nome ?? aluno.nome, bio: bio ?? null, ...(link_externo !== undefined ? { link_externo } : {}), ...(cpfLimpo !== undefined ? { cpf: cpfLimpo } : {}) })
    .eq('id', aluno_id)

  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 400 })

  // Sincroniza CPF para gestor se o aluno tiver um registro PRO sem CPF
  if (cpfLimpo) {
    await (adminClient.from('gestores') as any)
      .update({ cpf: cpfLimpo })
      .eq('user_id', user.id)
      .is('cpf', null)
  }

  return NextResponse.json({ ok: true })
}
