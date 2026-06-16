import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'
import { audit, getIp } from '@/lib/audit'
import { traduzirErro } from '@/lib/erros'

export const dynamic = 'force-dynamic'

// Limpa auth user órfão (auth existe mas aluno foi deletado da tabela)
// Usado para desbloquear e-mails que ficaram presos após deleção com bug
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'email obrigatório' }, { status: 400 })

  const emailLimpo = email.toLowerCase().trim()

  // Garante que NÃO existe aluno ativo com esse e-mail (segurança)
  const { data: alunoAtivo } = await adminClient.from('alunos')
    .select('id, tenant_id').eq('email', emailLimpo).maybeSingle()

  if (alunoAtivo) {
    // Se aluno existe e pertence ao tenant do admin, bloqueia — não é órfão
    if (!ctx.tenantId || alunoAtivo.tenant_id === ctx.tenantId) {
      return NextResponse.json({ error: 'Aluno ainda existe na plataforma. Delete o aluno primeiro.' }, { status: 400 })
    }
  }

  // Busca o auth user por e-mail com paginação completa
  let authUser = null
  let page = 1
  const MAX_PAGES = 20
  while (!authUser && page <= MAX_PAGES) {
    const { data: lista } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 })
    if (!lista?.users?.length) break
    authUser = lista.users.find(u => u.email === emailLimpo) ?? null
    if (authUser || lista.users.length < 1000) break
    page++
  }

  if (!authUser) {
    return NextResponse.json({ ok: true, msg: 'Nenhum auth user encontrado para esse e-mail. Já está limpo.' })
  }

  // Verifica se o auth user tem aluno vinculado em QUALQUER tenant
  const { data: alunoVinculado } = await adminClient.from('alunos')
    .select('id').eq('user_id', authUser.id).maybeSingle()

  if (alunoVinculado) {
    return NextResponse.json({ error: 'Auth user tem aluno vinculado. Delete o aluno pela tela de consultores antes.' }, { status: 400 })
  }

  // Orphan confirmado — deleta o auth user
  const { error } = await adminClient.auth.admin.deleteUser(authUser.id)
  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 500 })

  await audit({
    acao: 'auth.orfao_deletado',
    entidade: 'auth.users',
    entidade_id: authUser.id,
    tenant_id: ctx.tenantId ?? null,
    usuario_id: user.id,
    usuario_tipo: 'admin',
    dados_anteriores: { email: emailLimpo },
    ip: getIp(req),
  })

  return NextResponse.json({ ok: true, msg: `Auth user deletado. O e-mail ${emailLimpo} está liberado para novo cadastro.` })
}
