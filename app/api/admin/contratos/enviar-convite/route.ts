import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'
import { enviarWhatsApp } from '@/lib/whatsapp'
import { getAppUrl } from '@/lib/get-app-url'

export const dynamic = 'force-dynamic'

// GET — retorna consultores formados que ainda não assinaram
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  // Busca formados do tenant
  let q = adminClient.from('alunos')
    .select('id, nome, whatsapp')
    .eq('status', 'concluido')
  if (ctx.tenantId) q = q.eq('tenant_id', ctx.tenantId)
  const { data: formados } = await q

  if (!formados?.length) return NextResponse.json({ total: 0, pendentes: 0, lista: [] })

  // Quais já assinaram (pelo whatsapp)
  const wppFormados = formados.map((a: any) => a.whatsapp.replace(/\D/g, ''))
  const { data: jaAssinaram } = await adminClient.from('contratos')
    .select('whatsapp')
    .in('whatsapp', wppFormados)

  const setAssinados = new Set((jaAssinaram ?? []).map((c: any) => c.whatsapp))
  const pendentes = formados.filter((a: any) => !setAssinados.has(a.whatsapp.replace(/\D/g, '')))

  return NextResponse.json({
    total: formados.length,
    pendentes: pendentes.length,
    lista: pendentes.map((a: any) => ({ nome: a.nome, whatsapp: a.whatsapp })),
  })
}

// POST — envia convite de assinatura para todos os pendentes (ou lista específica)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  // Se vier lista específica de whatsapps, usa ela. Se não, busca todos os pendentes.
  let lista: { nome: string; whatsapp: string }[] = body.lista ?? []

  if (!lista.length) {
    let q = adminClient.from('alunos')
      .select('nome, whatsapp')
      .eq('status', 'concluido')
    if (ctx.tenantId) q = q.eq('tenant_id', ctx.tenantId)
    const { data: formados } = await q

    if (!formados?.length) return NextResponse.json({ enviados: 0, erros: 0 })

    const wppFormados = formados.map((a: any) => a.whatsapp.replace(/\D/g, ''))
    const { data: jaAssinaram } = await adminClient.from('contratos')
      .select('whatsapp').in('whatsapp', wppFormados)
    const setAssinados = new Set((jaAssinaram ?? []).map((c: any) => c.whatsapp))
    lista = formados.filter((a: any) => !setAssinados.has(a.whatsapp.replace(/\D/g, '')))
  }

  if (!lista.length) return NextResponse.json({ enviados: 0, erros: 0 })

  const appUrl = await getAppUrl()
  const linkContrato = `${appUrl}/contrato`

  // Busca nome da plataforma
  const { data: nomeCfg } = await adminClient.from('configuracoes')
    .select('valor').eq('chave', 'site_nome').maybeSingle()
  let nomePlataforma = 'Plataforma'
  try { nomePlataforma = JSON.parse(String(nomeCfg?.valor ?? '')) || nomePlataforma } catch { /**/ }

  let enviados = 0
  let erros = 0

  for (const consultor of lista) {
    const msg = [
      `📄 *Contrato de Representação*`,
      ``,
      `Olá, *${consultor.nome.split(' ')[0]}*!`,
      ``,
      `Você concluiu o treinamento ${nomePlataforma} e está apto(a) a assinar seu contrato de representação. 🎉`,
      ``,
      `👉 Acesse o link abaixo e assine digitalmente em poucos minutos:`,
      linkContrato,
      ``,
      `_Após assinar, você receberá o PDF aqui no WhatsApp._`,
    ].join('\n')

    const ok = await enviarWhatsApp(consultor.whatsapp, msg)
    if (ok) enviados++
    else erros++

    // Pausa leve para não sobrecarregar a API de WhatsApp
    await new Promise(r => setTimeout(r, 300))
  }

  return NextResponse.json({ enviados, erros })
}
