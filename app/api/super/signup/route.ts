import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { criarCobrancaPix } from '@/lib/efi'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

function gerarSenha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// POST público — associação se cadastra e gera PIX para ativar o acesso
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { nome_empresa, contato_nome, whatsapp, email, dominio, plano_id } = body

  if (!nome_empresa || !contato_nome || !whatsapp || !email || !plano_id)
    return NextResponse.json({ error: 'Preencha todos os campos obrigatórios.' }, { status: 400 })

  const adminClient = createServiceRoleClient()

  const wppLimpo = whatsapp.replace(/\D/g, '')
  const emailLimpo = email.trim().toLowerCase()

  // Verifica duplicata por email e por whatsapp separadamente (evita crash do .maybeSingle() com múltiplos resultados)
  const [{ data: porEmail }, { data: porWpp }] = await Promise.all([
    (adminClient.from('clientes') as any).select('id, status_pagamento, ativo').eq('contato_email', emailLimpo).maybeSingle(),
    (adminClient.from('clientes') as any).select('id, status_pagamento, ativo').eq('contato_whatsapp', wppLimpo).maybeSingle(),
  ])
  const existe = porEmail || porWpp

  if (existe) {
    if (existe.ativo) return NextResponse.json({ error: 'Já existe uma conta ativa com este e-mail ou WhatsApp. Entre em contato com o suporte.' }, { status: 409 })
    if (existe.status_pagamento === 'aguardando_pagamento') {
      const { data: cobranca } = await (adminClient.from('cobrancas') as any)
        .select('pix_copia_cola, qrcode_base64, valor')
        .eq('cliente_id', existe.id)
        .eq('status', 'pendente')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (cobranca) return NextResponse.json({ ok: true, cliente_id: existe.id, ...cobranca, ja_existia: true })
    }
    // Status suspenso ou outro — bloqueia novo cadastro com mesmo contato
    return NextResponse.json({ error: 'Já existe um cadastro com este e-mail ou WhatsApp. Entre em contato com o suporte.' }, { status: 409 })
  }

  // Busca o plano configurado
  const { data: cfgPlanos } = await (adminClient.from('configuracoes') as any)
    .select('valor').eq('chave', 'planos_saas').maybeSingle()

  let planos: any[] = []
  try { planos = JSON.parse(cfgPlanos?.valor ?? '[]') } catch { planos = [] }

  const plano = planos.find((p: any) => p.id === plano_id)
  if (!plano) return NextResponse.json({ error: 'Plano não encontrado.' }, { status: 404 })
  if (!plano.preco || plano.preco <= 0) return NextResponse.json({ error: 'Este plano requer contato direto para cotação. Entre em contato pelo WhatsApp.' }, { status: 400 })

  const admin_senha = gerarSenha()

  // Cria o cliente com status pendente
  const { data: cliente, error: clienteErr } = await (adminClient.from('clientes') as any).insert({
    nome: nome_empresa,
    dominio: dominio?.trim() || null,
    contato_nome,
    contato_whatsapp: wppLimpo,
    contato_email: emailLimpo,
    ativo: false,
    status_pagamento: 'aguardando_pagamento',
    mensalidade: plano.preco,
    gestor_ativo: plano.gestor_ativo || false,
    limite_consultores: plano.limite_consultores || 100,
    observacoes: JSON.stringify({
      _signup: {
        admin_email: emailLimpo,
        admin_nome: contato_nome,
        admin_senha,
        plano_id,
        plano_nome: plano.nome,
      }
    }),
  }).select().single()

  if (clienteErr || !cliente) return NextResponse.json({ error: clienteErr?.message || 'Erro ao criar cadastro.' }, { status: 500 })

  // Gera PIX
  const txid = randomUUID().replace(/-/g, '').substring(0, 35)

  try {
    const vencimento = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { pixCopiaECola, qrcodeBase64 } = await criarCobrancaPix({
      txid,
      valor: plano.preco,
      vencimento,
      nomeDevedor: contato_nome,
      descricao: `Ativação ${plano.nome} — ${nome_empresa}`,
    })

    await (adminClient.from('cobrancas') as any).insert({
      cliente_id: cliente.id,
      txid,
      valor: plano.preco,
      status: 'pendente',
      pix_copia_cola: pixCopiaECola,
      qrcode_base64: qrcodeBase64,
    })

    await (adminClient.from('clientes') as any).update({ pix_txid: txid }).eq('id', cliente.id)

    return NextResponse.json({
      ok: true,
      cliente_id: cliente.id,
      pix_copia_cola: pixCopiaECola,
      qrcode_base64: qrcodeBase64,
      valor: plano.preco,
      plano_nome: plano.nome,
    })
  } catch (e: any) {
    // Cleanup em caso de erro no PIX
    await (adminClient.from('clientes') as any).delete().eq('id', cliente.id)
    return NextResponse.json({ error: 'Erro ao gerar PIX: ' + e.message }, { status: 500 })
  }
}

// GET — consulta status do pagamento de um signup pendente
export async function GET(req: NextRequest) {
  const cliente_id = req.nextUrl.searchParams.get('cliente_id')
  if (!cliente_id) return NextResponse.json({ error: 'cliente_id obrigatório' }, { status: 400 })

  const adminClient = createServiceRoleClient()
  const { data: cliente } = await (adminClient.from('clientes') as any)
    .select('id, ativo, status_pagamento, nome')
    .eq('id', cliente_id).maybeSingle()

  if (!cliente) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json({ ativo: cliente.ativo, status_pagamento: cliente.status_pagamento })
}
