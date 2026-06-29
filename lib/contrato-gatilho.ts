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
  refId: string | null
  alunoId: string
  tenantId: string | null
  appUrl: string
}): Promise<void> {
  const adminClient = createServiceRoleClient()

  let gq = adminClient
    .from('contrato_gatilhos')
    .select('id, template_id, variaveis_fixas')
    .eq('ativo', true)
    .eq('tipo', tipo as 'modulo' | 'curso_completo')
  if (tenantId) gq = gq.eq('tenant_id', tenantId)
  if (tipo === 'modulo' && refId) gq = gq.eq('ref_id', refId)
  if (tipo === 'curso_completo') gq = gq.is('ref_id', null)

  const { data: gatilhos } = await gq
  if (!gatilhos || gatilhos.length === 0) return

  const { data: aluno } = await adminClient
    .from('alunos')
    .select('id, nome, whatsapp, email, cpf')
    .eq('id', alunoId)
    .maybeSingle()
  if (!aluno) return

  const instancia = await getInstanciaTenant(tenantId, adminClient)

  for (const gatilho of gatilhos) {
    // Idempotencia: verifica se ja existe contrato deste gatilho para este aluno
    const { data: contratosGatilho } = await adminClient
      .from('contratos_digitais')
      .select('id')
      .eq('gatilho_tipo', tipo as 'modulo' | 'curso_completo')
      .eq('tenant_id', tenantId ?? '')
      .limit(200)

    if (contratosGatilho && contratosGatilho.length > 0) {
      const idsGatilho = contratosGatilho.map(c => c.id)
      const { count: assinanteCount } = await adminClient
        .from('contrato_assinantes')
        .select('id', { count: 'exact', head: true })
        .in('contrato_id', idsGatilho)
        .eq('whatsapp', aluno.whatsapp ?? '')
      if ((assinanteCount ?? 0) > 0) continue
    }

    const { data: template } = await adminClient
      .from('contrato_templates')
      .select('nome, corpo_html, variaveis')
      .eq('id', gatilho.template_id)
      .maybeSingle()
    if (!template) continue

    const variaveis: Record<string, string> = {
      nome: aluno.nome,
      cpf: aluno.cpf ?? '',
      whatsapp: aluno.whatsapp ?? '',
      email: aluno.email ?? '',
      data: new Date().toLocaleDateString('pt-BR'),
      ...(gatilho.variaveis_fixas as Record<string, string> ?? {}),
    }

    const corpoRenderizado = renderizarTemplate(template.corpo_html, variaveis)
    const numero = await gerarNumeroContrato(adminClient, tenantId)
    const titulo = `${template.nome} — ${aluno.nome}`

    const { data: cfgSig } = await adminClient
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'contrato_assinatura_contratante_url')
      .maybeSingle()
    const assinaturaAvp = cfgSig?.valor ? String(cfgSig.valor).replace(/"/g, '') : null

    const { data: contrato } = await adminClient
      .from('contratos_digitais')
      .insert({
        tenant_id: tenantId,
        template_id: gatilho.template_id,
        tipo: 'principal' as const,
        titulo,
        numero_registro: numero,
        corpo_renderizado: corpoRenderizado,
        variaveis_usadas: variaveis,
        status: 'enviado' as const,
        assinatura_avp_url: assinaturaAvp,
        assinado_avp_em: assinaturaAvp ? new Date().toISOString() : null,
        gatilho_tipo: tipo as 'modulo' | 'curso_completo',
        gatilho_ref_id: refId,
      })
      .select('id')
      .single()

    if (!contrato) continue

    const { token, expira } = gerarTokenAssinante()
    await adminClient.from('contrato_assinantes').insert({
      contrato_id: contrato.id,
      ordem: 1,
      papel: 'destinatario' as const,
      nome: aluno.nome,
      email: aluno.email ?? null,
      whatsapp: aluno.whatsapp,
      token_acesso: token,
      token_expira_em: expira.toISOString(),
      status: 'pendente' as const,
    })

    if (aluno.whatsapp && instancia) {
      const link = `${appUrl}/contrato/assinar/${token}`
      const msg = `Ola, ${aluno.nome}!\n\nParabens por concluir o modulo! Voce tem um contrato pendente de assinatura:\n*${titulo}*\n\nClique no link para assinar digitalmente:\n${link}`
      await enviarWhatsApp(aluno.whatsapp, msg, instancia).catch(() => {})
    }
  }
}
