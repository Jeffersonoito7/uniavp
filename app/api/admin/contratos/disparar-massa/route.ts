import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'
import { renderizarTemplate, gerarNumeroContrato, gerarTokenAssinante } from '@/lib/contrato-digital'
import { enviarWhatsAppComFila, getInstanciaTenant } from '@/lib/whatsapp'
import { getAppUrl } from '@/lib/get-app-url'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { templateId, alunoIds, contratadoPreenche } = await req.json() as {
    templateId: string
    alunoIds: string[]
    contratadoPreenche: boolean
  }

  if (!templateId || !Array.isArray(alunoIds) || alunoIds.length === 0) {
    return NextResponse.json({ error: 'templateId e alunoIds obrigatorios' }, { status: 400 })
  }

  // Busca template
  const { data: template } = await (adminClient.from('contrato_templates' as any) as any)
    .select('id, nome, corpo_html')
    .eq('id', templateId)
    .eq('arquivado', false)
    .maybeSingle()
  if (!template) return NextResponse.json({ error: 'Template nao encontrado' }, { status: 404 })

  // Busca variaveis da contratante
  const cfgChaves = ['contratante_razao_social', 'contratante_cnpj', 'contratante_endereco', 'contratante_representante']
  let cfgQ = adminClient.from('configuracoes').select('chave, valor').in('chave', cfgChaves)
  if (ctx.tenantId) cfgQ = cfgQ.eq('tenant_id', ctx.tenantId)
  const { data: cfgRows } = await cfgQ
  const contratanteVars: Record<string, string> = {}
  for (const r of cfgRows ?? []) {
    try { contratanteVars[r.chave] = JSON.parse(r.valor as string) } catch { contratanteVars[r.chave] = String(r.valor ?? '') }
  }

  // Busca alunos selecionados
  let alunosQ = adminClient
    .from('alunos')
    .select('id, nome, whatsapp, email, cpf')
    .in('id', alunoIds)
  if (ctx.tenantId) alunosQ = alunosQ.eq('tenant_id', ctx.tenantId)
  const { data: alunos } = await alunosQ

  if (!alunos || alunos.length === 0) {
    return NextResponse.json({ error: 'Nenhum aluno encontrado' }, { status: 404 })
  }

  const instancia = await getInstanciaTenant(ctx.tenantId, adminClient)
  const appUrl = await getAppUrl(ctx.tenantId)

  const erros: string[] = []
  let enviados = 0

  for (const aluno of alunos) {
    try {
      // Monta variaveis: contratante sempre substituida; contratado so se contratadoPreenche=false
      const varBase: Record<string, string> = {
        data: new Date().toLocaleDateString('pt-BR'),
        ...contratanteVars,
      }
      if (!contratadoPreenche) {
        // Preenche dados do aluno agora
        varBase['nome']     = aluno.nome ?? ''
        varBase['cpf']      = aluno.cpf ?? ''
        varBase['email']    = aluno.email ?? ''
        varBase['whatsapp'] = aluno.whatsapp ?? ''
        varBase['endereco'] = ''
      }
      // Se contratadoPreenche=true, variaveis do contratado ficam como {{nome}}, {{cpf}} etc

      const corpoRenderizado = renderizarTemplate(template.corpo_html, varBase)
      const numero = await gerarNumeroContrato(adminClient, ctx.tenantId)

      const { data: contrato, error: errContrato } = await adminClient
        .from('contratos_digitais')
        .insert({
          tenant_id: ctx.tenantId,
          template_id: templateId,
          tipo: 'principal' as const,
          titulo: template.nome,
          numero_registro: numero,
          corpo_renderizado: corpoRenderizado,
          variaveis_usadas: varBase,
          status: 'enviado' as const,
          criado_por: user.id,
        })
        .select('id, titulo')
        .single()

      if (errContrato || !contrato) {
        erros.push(`${aluno.nome ?? aluno.id}: erro ao criar contrato`)
        continue
      }

      const { token, expira } = gerarTokenAssinante()

      await (adminClient.from('contrato_assinantes') as any).insert({
        contrato_id: contrato.id,
        ordem: 1,
        papel: 'destinatario',
        nome: contratadoPreenche ? null : (aluno.nome ?? null),
        email: aluno.email ?? null,
        whatsapp: aluno.whatsapp ? aluno.whatsapp.replace(/\D/g, '') : null,
        cpf: contratadoPreenche ? null : (aluno.cpf ?? null),
        token_acesso: token,
        token_expira_em: expira.toISOString(),
        status: 'pendente',
      })

      const link = `${appUrl}/contrato/assinar/${token}`
      const nome = aluno.nome ?? 'prezado(a)'
      const instrucao = contratadoPreenche
        ? `Voce tem um contrato para assinar:\n*${template.nome}*\n\nAo abrir o link, preencha seus dados e assine digitalmente:`
        : `Voce tem um contrato pendente de assinatura:\n*${template.nome}*\n\nClique no link para ler e assinar digitalmente:`
      const mensagem = `Ola, ${nome}!\n\n${instrucao}\n${link}\n\nO link expira em 30 dias.`

      const wpp = aluno.whatsapp ? aluno.whatsapp.replace(/\D/g, '') : null
      if (wpp && instancia) {
        await enviarWhatsAppComFila(wpp, mensagem, instancia, adminClient, ctx.tenantId)
          .catch(() => {})
      }

      enviados++
    } catch (e) {
      erros.push(`${aluno.nome ?? aluno.id}: ${e instanceof Error ? e.message : 'erro desconhecido'}`)
    }
  }

  return NextResponse.json({ ok: true, enviados, erros })
}
