import { traduzirErro } from '@/lib/erros'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'
import { audit, getIp } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id, nome, email, whatsapp, status, gestor_nome, gestor_whatsapp, nova_senha, user_id, indicador_whatsapp, cpf, especialista } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  // Captura estado anterior para o audit
  let dadosAnteriores: Record<string, unknown> | null = null
  const { data: anterior } = await adminClient.from('alunos').select('nome,email,whatsapp,status,gestor_nome,gestor_whatsapp,indicador_id').eq('id', id).maybeSingle()
  if (anterior) dadosAnteriores = anterior as Record<string, unknown>

  const updates: { nome?: string; email?: string; whatsapp?: string; status?: string; gestor_nome?: string | null; gestor_whatsapp?: string | null; indicador_id?: string | null } = {}
  if (nome !== undefined) updates.nome = nome
  if (email !== undefined) updates.email = email
  if (whatsapp !== undefined) updates.whatsapp = whatsapp
  if (status !== undefined) updates.status = status
  if (gestor_nome !== undefined) updates.gestor_nome = gestor_nome
  if (gestor_whatsapp !== undefined) updates.gestor_whatsapp = gestor_whatsapp
  if (indicador_whatsapp !== undefined) {
    if (!indicador_whatsapp) {
      updates.indicador_id = null
    } else {
      const wpp = String(indicador_whatsapp).replace(/\D/g, '')
      let indQuery = adminClient.from('indicadores').select('id').eq('whatsapp', wpp)
      if (ctx.tenantId) indQuery = indQuery.eq('tenant_id', ctx.tenantId)
      const { data: indExistente } = await indQuery.maybeSingle()

      if (indExistente) {
        updates.indicador_id = indExistente.id
      } else {
        let alunoIndQuery = adminClient.from('alunos').select('id, nome').eq('whatsapp', wpp)
        if (ctx.tenantId) alunoIndQuery = alunoIndQuery.eq('tenant_id', ctx.tenantId)
        const { data: alunoInd } = await alunoIndQuery.maybeSingle()

        if (alunoInd) {
          const { data: novoInd } = await adminClient.from('indicadores')
            .insert({ whatsapp: wpp, nome: alunoInd.nome, tipo: 'aluno', ...(ctx.tenantId ? { tenant_id: ctx.tenantId } : {}) })
            .select('id').single()
          if (novoInd) updates.indicador_id = novoInd.id
        } else {
          return NextResponse.json({ error: 'Indicador não encontrado com este WhatsApp' }, { status: 400 })
        }
      }
    }
  }

  let putQuery = adminClient.from('alunos').update(updates).eq('id', id)
  if (ctx.tenantId) putQuery = putQuery.eq('tenant_id', ctx.tenantId)
  const { data: aluno, error } = await putQuery.select('*').single()
  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 400 })

  // Salva CPF e especialista separado (colunas adicionadas via migration, podem não estar nos tipos gerados)
  const extraUpdates: Record<string, unknown> = {}
  if (cpf !== undefined) extraUpdates.cpf = cpf ? String(cpf).replace(/\D/g, '') || null : null
  if (especialista !== undefined) extraUpdates.especialista = !!especialista
  if (Object.keys(extraUpdates).length > 0) {
    await (adminClient.from('alunos') as any).update(extraUpdates).eq('id', id)
  }

  let authUserId = aluno.user_id ?? user_id
  if (nova_senha && nova_senha.length >= 6 && !authUserId) {
    return NextResponse.json({ error: 'Este consultor ainda não tem conta ativa. Use "Reenviar Acesso" primeiro para criar a conta, depois redefina a senha.' }, { status: 400 })
  }
  if (authUserId) {
    const authUpdates: Record<string, unknown> = {}
    if (email) authUpdates.email = email
    if (nova_senha && nova_senha.length >= 6) authUpdates.password = nova_senha
    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await adminClient.auth.admin.updateUserById(authUserId, authUpdates)
      if (authError) {
        // auth user pode ter sido deletado — tenta localizar pelo email atual
        const emailBusca = email || aluno.email
        if (emailBusca && nova_senha) {
          let authEncontrado: string | null = null
          let page = 1
          while (!authEncontrado) {
            const { data: lista } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 })
            if (!lista?.users?.length) break
            const encontrado = lista.users.find(u => u.email === emailBusca)
            if (encontrado) { authEncontrado = encontrado.id; break }
            if (lista.users.length < 1000) break
            page++
          }
          if (authEncontrado) {
            // Reconecta o user_id no registro do aluno e aplica as atualizações
            await (adminClient.from('alunos') as any).update({ user_id: authEncontrado }).eq('id', id)
            authUserId = authEncontrado
            const { error: authError2 } = await adminClient.auth.admin.updateUserById(authEncontrado, authUpdates)
            if (authError2 && nova_senha) {
              return NextResponse.json({ error: 'Dados salvos, mas falha ao alterar a senha: ' + authError2.message }, { status: 500 })
            }
          } else {
            return NextResponse.json({ error: 'Dados salvos, mas o usuário não tem conta de acesso ativa. Use "Reenviar Acesso" para criar o acesso e depois redefina a senha.' }, { status: 500 })
          }
        } else if (nova_senha) {
          return NextResponse.json({ error: 'Dados salvos, mas falha ao alterar a senha: ' + authError.message }, { status: 500 })
        }
      }
    }
  }

  // Audit: distingue alteracao de status de edicao geral
  const acao = status !== undefined && status !== dadosAnteriores?.status
    ? 'aluno.status_alterado'
    : nova_senha ? 'aluno.senha_resetada' : 'aluno.status_alterado'

  await audit({
    acao,
    entidade: 'alunos',
    entidade_id: id,
    tenant_id: ctx.tenantId ?? null,
    usuario_id: user.id,
    usuario_tipo: 'admin',
    dados_anteriores: dadosAnteriores,
    dados_novos: updates as Record<string, unknown>,
    ip: getIp(req),
  })

  return NextResponse.json({ ok: true, aluno })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  // Busca pelo id apenas (sem filtro de tenant) para garantir que encontra o aluno
  const { data: aluno } = await adminClient.from('alunos')
    .select('user_id, email, nome, whatsapp, tenant_id').eq('id', id).maybeSingle()

  // Verifica se o aluno pertence ao tenant do admin (segurança)
  if (aluno && ctx.tenantId && aluno.tenant_id !== ctx.tenantId) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { error } = await adminClient.from('alunos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 500 })

  // Deleta o usuário do auth para liberar o e-mail
  if (aluno?.user_id) {
    await adminClient.auth.admin.deleteUser(aluno.user_id).catch(() => {})
  } else if (aluno?.email) {
    let authExistente = null
    let page = 1
    while (!authExistente) {
      const { data: lista } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 })
      if (!lista?.users?.length) break
      authExistente = lista.users.find(u => u.email === aluno.email) ?? null
      if (authExistente || lista.users.length < 1000) break
      page++
    }
    if (authExistente) await adminClient.auth.admin.deleteUser(authExistente.id).catch(() => {})
  }

  await audit({
    acao: 'aluno.deletado',
    entidade: 'alunos',
    entidade_id: id,
    tenant_id: ctx.tenantId ?? null,
    usuario_id: user.id,
    usuario_tipo: 'admin',
    dados_anteriores: aluno ? { nome: aluno.nome, email: aluno.email, whatsapp: aluno.whatsapp } : null,
    ip: getIp(req),
  })

  return NextResponse.json({ ok: true })
}
