import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const [{ data: adminRecord }, { data: superRecord }] = await Promise.all([
    adminClient.from('admins').select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
    adminClient.from('super_admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
  ])
  if (!adminRecord && !superRecord) return NextResponse.json({ error: 'Nao autorizado.' }, { status: 403 })

  const { id } = await params
  const tid = (adminRecord?.tenant_id ?? null) as string | null
  const body = await req.json()
  const { nome, whatsapp, email, cpf, status, plano, plano_vencimento, nova_senha } = body as {
    nome: string; whatsapp: string; email: string; cpf: string | null
    status: string; plano: 'PRO' | 'Free'; plano_vencimento: string | null
    nova_senha?: string
  }

    // Verificar que o aluno pertence ao tenant
  let qAluno = adminClient.from('alunos').select('id, user_id, email').eq('id', id)
  if (tid) qAluno = (qAluno as any).eq('tenant_id', tid)
  const { data: aluno, error: erroAluno } = await (qAluno as any).maybeSingle()
  if (erroAluno || !aluno) return NextResponse.json({ error: 'Aluno não encontrado.' }, { status: 404 })

  // Valida a autorização para troca de senha ANTES de qualquer escrita, mas só
  // efetiva a troca DEPOIS do update da tabela (ver abaixo). Isso evita o bug em
  // que a senha era trocada no Auth e, logo após, o update da tabela falhava
  // (ex.: status inválido), deixando a senha alterada sem o usuário/admin saber.
  if (nova_senha) {
    if (nova_senha.length < 6) return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 })

    const userIdSenha = (aluno as any).user_id as string | null
    const ehProprioUsuario = userIdSenha && user.id === userIdSenha
    const temPermissao = ehProprioUsuario || adminRecord || superRecord
    if (!temPermissao) {
      return NextResponse.json({ error: 'Sem permissão para alterar a senha deste aluno.' }, { status: 403 })
    }
  }

  // Atualizar tabela alunos PRIMEIRO: se o status (ou qualquer campo) for inválido,
  // a request falha aqui, antes de tocar na senha — nada fica em estado parcial.
  const { error: errUpd } = await adminClient.from('alunos').update({ nome, whatsapp, email, cpf: cpf || null, status }).eq('id', id)
  if (errUpd) return NextResponse.json({ error: errUpd.message }, { status: 500 })

  const userId = (aluno as any).user_id as string | null

  // Troca de senha por ÚLTIMO (após o update ter sido validado/gravado).
  // Mantém o fallback por email usado na rota de consultores: se o user_id do
  // banco estiver dessincronizado, localiza o auth user pelo email e corrige.
  if (nova_senha) {
    let authUserId = userId
    if (!authUserId) {
      return NextResponse.json({ error: 'Dados salvos, mas este aluno não tem conta de acesso ativa. Use "Reenviar Acesso" para criar a conta e depois redefina a senha.' }, { status: 400 })
    }
    let { error: errSenha } = await adminClient.auth.admin.updateUserById(authUserId, { password: nova_senha })
    if (errSenha) {
      // user_id defasado — procura o auth user pelo email atual do aluno
      const emailBusca = (aluno as any).email as string | undefined
      let authEncontrado: string | null = null
      let page = 1
      while (!authEncontrado && page <= 50 && emailBusca) {
        const { data: lista } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 })
        if (!lista?.users?.length) break
        const encontrado = lista.users.find(u => u.email === emailBusca)
        if (encontrado) { authEncontrado = encontrado.id; break }
        if (lista.users.length < 1000) break
        page++
      }
      if (authEncontrado) {
        await (adminClient.from('alunos') as any).update({ user_id: authEncontrado }).eq('id', id)
        authUserId = authEncontrado
        const { error: errSenha2 } = await adminClient.auth.admin.updateUserById(authEncontrado, { password: nova_senha })
        errSenha = errSenha2 ?? null
      }
      if (errSenha) {
        return NextResponse.json({ error: 'Dados salvos, mas falha ao alterar a senha: ' + errSenha.message }, { status: 500 })
      }
    }
  }

  if (userId) {
    if (plano === 'PRO') {
      const { data: gestor } = await adminClient.from('gestores').select('id, tenant_id').eq('user_id', userId).maybeSingle()
      if (gestor) {
        const updGestor: Record<string, unknown> = { ativo: true, status_assinatura: 'ativo', plano_vencimento: plano_vencimento ?? null }
        // Back-fill de tenant quando o gestor estava sem vínculo, evitando que
        // futuras atualizações por tenant (ex.: Ativar PRO) deixem de encontrá-lo.
        if (tid && !(gestor as any).tenant_id) updGestor.tenant_id = tid
        await (adminClient.from('gestores') as any).update(updGestor).eq('user_id', userId)
      } else {
        await adminClient.from('gestores').insert({
          user_id: userId, nome, whatsapp, email, ativo: true,
          status_assinatura: 'ativo', plano_vencimento: plano_vencimento ?? null,
          ...(tid ? { tenant_id: tid } : {}),
        } as any)
      }
    } else {
      // Rebaixar para Free
      const { data: gestor } = await adminClient.from('gestores').select('id').eq('user_id', userId).maybeSingle()
      if (gestor) {
        await adminClient.from('gestores').update({ ativo: false, status_assinatura: 'free' }).eq('user_id', userId)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
