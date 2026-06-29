import { createServiceRoleClient } from '@/lib/supabase-server'
import { renderizarTemplate, gerarNumeroContrato, gerarTokenAssinante } from '@/lib/contrato-digital'
import { enviarWhatsApp, getInstanciaTenant } from '@/lib/whatsapp'

type GatilhoTipo = 'modulo' | 'curso_completo'

export async function dispararGatilhoContrato({
  tipo,
  refId,
  alunoId,
  tenantId,
  appUrl,
}: {
  tipo: GatilhoTipo
  refId: string | null  // modulo_id para 'modulo', null para 'curso_completo'
  alunoId: string
  tenantId: string | null
  appUrl: string
}): Promise<void> {
  const adminClient = createServiceRoleClient()

  // Busca gatilhos ativos para este tipo e ref
  let gq = (adminClient.from('contrato_gatilhos' as any) as any)
    .select('id, template_id, variaveis_fixas')
    .eq('ativo', true)
    .eq('tipo', tipo)
  if (tenantId) gq = gq.eq('tenant_id', tenantId)
  if (tipo === 'modulo' && refId) gq = gq.eq('ref_id', refId)
  if (tipo === 'curso_completo') gq = gq.is('ref_id', null)

  const { data: gatilhos } = await gq
  if (!gatilhos || gatilhos.length === 0) return

  // Busca dados do aluno
  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp, email, cpf')
    .eq('id', alunoId)
    .maybeSingle()
  if (!aluno) return

  const instancia = await getInstanciaTenant(tenantId, adminClient)

  for (const gatilho of gatilhos) {
    // Verifica se ja existe contrato gerado por este gatilho para este aluno (idempotencia)
    let contratoExisteQ = (adminClient.from('contratos_digitais' as any) as any)
      .select('id')
      .eq('gatilho_tipo', tipo)
      .limit(200)
    if (tenantId) contratoExisteQ = contratoExisteQ.eq('tenant_id', tenantId)
    if (tipo === 'modulo' && refId) contratoExisteQ = contratoExisteQ.eq('gatilho_ref_id', refId)
    const { data: contratosGatilho } = await contratoExisteQ

    if (contratosGatilho && contratosGatilho.length > 0) {
      const idsGatilho = contratosGatilho.map((c: { id: string }) => c.id)
      const { count: assinanteCount } = await (adminClient.from('contrato_assinantes' as any) as any)
        .select('id', { count: 'exact', head: true })
        .in('contrato_id', idsGatilho)
        .eq('whatsapp', aluno.whatsapp)
      if ((assinanteCount ?? 0) > 0) continue
    }

    // Busca template
    const { data: template } = await (adminClient.from('contrato_templates' as any) as any)
      .select('nome, corpo_html, variaveis')
      .eq('id', gatilho.template_id)
      .maybeSingle()
    if (!template) continue

    // Monta variaveis: fixas do gatilho + dados do aluno
    const variaveis: Record<string, string> = {
      nome: aluno.nome,
      cpf: aluno.cpf ?? '',
      whatsapp: aluno.whatsapp,
      email: aluno.email ?? '',
      data: new Date().toLocaleDateString('pt-BR'),
      ...(gatilho.variaveis_fixas ?? {}),
    }

    const corpoRenderizado = renderizarTemplate(template.corpo_html, variaveis)
    const numero = await gerarNumeroContrato(adminClient, tenantId)
    const titulo = `${template.nome} — ${aluno.nome}`

    // Busca assinatura AVP
    const { data: cfgSig } = await adminClient.from('configuracoes')
      .select('valor').eq('chave', 'contrato_assinatura_contratante_url').maybeSingle()
    const assinaturaAvp = cfgSig?.valor ? String(cfgSig.valor).replace(/"/g, '') : null

    // Cria contrato
    const { data: contrato } = await (adminClient.from('contratos_digitais' as any) as any)
      .insert({
        tenant_id: tenantId,
        template_id: gatilho.template_id,
        tipo: 'principal',
        titulo,
        numero_registro: numero,
        corpo_renderizado: corpoRenderizado,
        variaveis_usadas: variaveis,
        status: 'enviado',
        assinatura_avp_url: assinaturaAvp,
        assinado_avp_em: assinaturaAvp ? new Date().toISOString() : null,
        gatilho_tipo: tipo,
        gatilho_ref_id: refId,
      })
      .select('id')
      .single()

    if (!contrato) continue

    // Cria assinante (o proprio aluno)
    const { token, expira } = gerarTokenAssinante()
    await (adminClient.from('contrato_assinantes' as any) as any).insert({
      contrato_id: contrato.id,
      ordem: 1,
      papel: 'destinatario',
      nome: aluno.nome,
      email: aluno.email ?? null,
      whatsapp: aluno.whatsapp,
      token_acesso: token,
      token_expira_em: expira.toISOString(),
      status: 'pendente',
    })

    // Envia link por WhatsApp
    if (aluno.whatsapp && instancia) {
      const link = `${appUrl}/contrato/assinar/${token}`
      const msg = `Ola, ${aluno.nome}!\n\nParabens por concluir o modulo! Voce tem um contrato pendente de assinatura:\n*${titulo}*\n\nClique no link para assinar digitalmente:\n${link}`
      await enviarWhatsApp(aluno.whatsapp, msg, instancia).catch(() => {})
    }
  }
}
