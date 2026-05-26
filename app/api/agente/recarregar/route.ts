import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getPacotes, garantirRegistroCredito } from '@/lib/agente-creditos'
import { criarCobrancaPix } from '@/lib/efi'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: gestor } = await adminClient.from('gestores')
    .select('id, nome, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!gestor) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { pacoteId } = await req.json()
  if (!pacoteId) return NextResponse.json({ error: 'pacoteId obrigatório' }, { status: 400 })

  const tenantId = gestor.tenant_id ?? null

  const pacotes = await getPacotes(tenantId, adminClient)
  const pacote = pacotes.find(p => p.id === pacoteId)
  if (!pacote) return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 })

  await garantirRegistroCredito(gestor.id, tenantId, adminClient)

  try {
    const txid = `agente${gestor.id.replace(/-/g, '').slice(0, 20)}${Date.now()}`
    const vencimento = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { pixCopiaECola, qrcodeBase64 } = await criarCobrancaPix({
      txid,
      valor: Number(pacote.valor),
      vencimento,
      nomeDevedor: gestor.nome,
      descricao: `Créditos do assistente IA — ${pacote.nome}`,
    })

    await adminClient.from('agente_recargas').insert({
      gestor_id: gestor.id,
      tenant_id: tenantId,
      pacote_id: pacote.id,
      creditos: pacote.creditos,
      valor: pacote.valor,
      txid,
      status: 'pendente',
    })

    return NextResponse.json({ ok: true, pixCopiaECola, qrcodeBase64, txid, pacote })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Falha ao gerar PIX: ${msg}` }, { status: 500 })
  }
}
