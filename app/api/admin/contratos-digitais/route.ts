import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'
import { renderizarTemplate, gerarNumeroContrato, gerarTokenAssinante } from '@/lib/contrato-digital'
import { enviarWhatsApp, getInstanciaTenant } from '@/lib/whatsapp'
import { getSiteConfig } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const tipo = searchParams.get('tipo')

  let q = adminClient
    .from('contratos_digitais')
    .select(`id, titulo, numero_registro, status, tipo, created_at, contrato_base_id, assinantes:contrato_assinantes(id, papel, nome, status)`)
    .order('created_at', { ascending: false })
    .limit(100)

  if (ctx.tenantId) q = q.eq('tenant_id', ctx.tenantId)
  if (status) q = q.eq('status', status as 'rascunho' | 'enviado' | 'parcialmente_assinado' | 'concluido' | 'cancelado')
  if (tipo) q = q.eq('tipo', tipo as 'principal' | 'aditivo')

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contratos: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const host = req.headers.get('host') || ''
  const siteConfig = await getSiteConfig(host)
  const appUrl = siteConfig.dominioCustomizado ? `https://${siteConfig.dominioCustomizado}` : `https://${host}`

  const {
    template_id,
    titulo,
    variaveis_usadas,
    assinantes,
    contrato_base_id,
    tipo,
    assinatura_avp_url,
  } = await req.json()

  if (!titulo || !assinantes || assinantes.length === 0) {
    return NextResponse.json({ error: 'titulo e assinantes obrigatorios' }, { status: 400 })
  }

  let corpoRenderizado = ''
  if (template_id) {
    const { data: template } = await adminClient
      .from('contrato_templates')
      .select('corpo_html')
      .eq('id', template_id)
      .maybeSingle()
    if (!template) return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    corpoRenderizado = renderizarTemplate(template.corpo_html, variaveis_usadas ?? {})
  }

  let assinaturaAvp: string | null = assinatura_avp_url ?? null
  if (!assinaturaAvp) {
    const { data: cfgSig } = await adminClient
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'contrato_assinatura_contratante_url')
      .maybeSingle()
    if (cfgSig?.valor) assinaturaAvp = typeof cfgSig.valor === 'string' ? cfgSig.valor : JSON.stringify(cfgSig.valor).replace(/"/g, '')
  }

  const numero = await gerarNumeroContrato(adminClient, ctx.tenantId)

  const { data: contrato, error: errContrato } = await adminClient
    .from('contratos_digitais')
    .insert({
      tenant_id: ctx.tenantId,
      template_id: template_id ?? null,
      contrato_base_id: contrato_base_id ?? null,
      tipo: (tipo ?? 'principal') as 'principal' | 'aditivo',
      titulo,
      numero_registro: numero,
      corpo_renderizado: corpoRenderizado,
      variaveis_usadas: variaveis_usadas ?? {},
      status: 'enviado' as const,
      assinatura_avp_url: assinaturaAvp,
      assinado_avp_em: assinaturaAvp ? new Date().toISOString() : null,
      criado_por: user.id,
    })
    .select('id, numero_registro, titulo')
    .single()

  if (errContrato || !contrato) {
    return NextResponse.json({ error: errContrato?.message ?? 'Erro ao criar contrato' }, { status: 500 })
  }

  const instancia = await getInstanciaTenant(ctx.tenantId, adminClient)
  const assinantesInseridos = []

  for (let i = 0; i < assinantes.length; i++) {
    const a = assinantes[i]
    const { token, expira } = gerarTokenAssinante()

    const { data: assinante } = await adminClient
      .from('contrato_assinantes')
      .insert({
        contrato_id: contrato.id,
        ordem: i + 1,
        papel: (a.papel ?? 'destinatario') as 'destinatario' | 'terceiro',
        nome: a.nome,
        email: a.email ?? null,
        whatsapp: a.whatsapp ? a.whatsapp.replace(/\D/g, '') : null,
        cpf: a.cpf ?? null,
        token_acesso: token,
        token_expira_em: expira.toISOString(),
        status: 'pendente' as const,
      })
      .select('id, nome, whatsapp, email, token_acesso')
      .single()

    if (assinante) {
      assinantesInseridos.push(assinante)

      const link = `${appUrl}/contrato/assinar/${token}`
      if (assinante.whatsapp && instancia) {
        const msg = `Ola, ${assinante.nome}!\n\nVoce tem um contrato pendente de assinatura:\n*${titulo}*\n\nClique no link abaixo para ler e assinar digitalmente:\n${link}\n\nO link expira em 30 dias.`
        await enviarWhatsApp(assinante.whatsapp, msg, instancia).catch(() => {})
      }
    }
  }

  return NextResponse.json({ ok: true, contrato, assinantes: assinantesInseridos })
}
