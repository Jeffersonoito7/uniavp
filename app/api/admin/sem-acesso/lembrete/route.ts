import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'
import { enviarWhatsApp, getInstanciaTenant } from '@/lib/whatsapp'
import { getAppUrl } from '@/lib/get-app-url'
export const dynamic = 'force-dynamic'

// POST /api/admin/sem-acesso/lembrete
// Envia lembrete WhatsApp para um aluno que nunca acessou nenhuma aula.
// Body: { aluno_id: string }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { aluno_id } = await req.json()
  if (!aluno_id) return NextResponse.json({ error: 'aluno_id obrigatório' }, { status: 400 })

  // Busca dados do aluno
  let q = adminClient.from('alunos').select('id, nome, whatsapp, status').eq('id', aluno_id)
  if (ctx.tenantId) q = q.eq('tenant_id', ctx.tenantId)
  const { data: aluno } = await q.maybeSingle()
  if (!aluno) return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })
  if (!aluno.whatsapp) return NextResponse.json({ error: 'Aluno sem WhatsApp cadastrado' }, { status: 400 })

  // Confirmar que o aluno realmente não tem progresso
  const { count } = await adminClient.from('progresso')
    .select('id', { count: 'exact', head: true })
    .eq('aluno_id', aluno_id)
    .eq('aprovado', true)
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'Aluno já possui progresso registrado' }, { status: 400 })
  }

  const appUrl = await getAppUrl(ctx.tenantId)
  const instancia = await getInstanciaTenant(ctx.tenantId, adminClient)

  const mensagem =
    `Olá, ${aluno.nome}! 👋\n\n` +
    `Notamos que você ainda não acessou nenhuma aula na plataforma. ` +
    `Seu acesso já está pronto — basta entrar e começar!\n\n` +
    `Acesse agora: ${appUrl}\n\n` +
    `Qualquer dúvida, estamos aqui para ajudar.`

  const enviado = await enviarWhatsApp(aluno.whatsapp, mensagem, instancia)
  if (!enviado) return NextResponse.json({ error: 'Falha ao enviar WhatsApp' }, { status: 500 })

  return NextResponse.json({ ok: true, nome: aluno.nome })
}
