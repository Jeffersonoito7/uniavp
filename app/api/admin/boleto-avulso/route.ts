import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { criarBoleto } from '@/lib/efi'
import { enviarWhatsApp } from '@/lib/whatsapp'
import { getCfg, getCfgNum } from '@/lib/cfg'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const [{ data: adminRecord }, { data: superRecord }] = await Promise.all([
    adminClient.from('admins').select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
    adminClient.from('super_admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
  ])
  if (!adminRecord && !superRecord) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const tid = (adminRecord?.tenant_id ?? null) as string | null

  const body = await req.json()
  const { nome, cpfCnpj, valor, vencimento, descricao, email, whatsapp } = body

  if (!nome || !cpfCnpj || !valor || !vencimento) {
    return NextResponse.json({ error: 'Nome, CPF/CNPJ, valor e vencimento são obrigatórios' }, { status: 400 })
  }
  if (isNaN(Number(valor)) || Number(valor) <= 0) {
    return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
  }

  // Lê configurações de boleto do tenant
  const [mensagemCfg, instrucoesCfg, siteNome] = await Promise.all([
    getCfg('boleto_mensagem', tid, adminClient),
    getCfg('boleto_instrucoes', tid, adminClient),
    getCfg('site_nome', tid, adminClient),
  ])
  const multa = await getCfgNum('boleto_multa', tid, adminClient, 2)
  const juros = await getCfgNum('boleto_juros', tid, adminClient, 1)

  const instrucoesFinal = instrucoesCfg
    ? instrucoesCfg.split('\n').filter(Boolean).slice(0, 4)
    : undefined

  try {
    const boleto = await criarBoleto({
      valor: Number(valor),
      vencimento,
      nomeCliente: nome,
      cpfCnpj,
      email: email || undefined,
      mensagem: mensagemCfg || `${descricao || 'Serviço'} — ${siteNome || 'Universidade'}`,
      instrucoes: instrucoesFinal,
      multa,
      juros,
      descricao: descricao || 'Boleto avulso',
    })

    // Envia por WhatsApp se informado
    if (whatsapp) {
      const valorFmt = Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      const dataFmt = new Date(vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
      await enviarWhatsApp(
        whatsapp.replace(/\D/g, ''),
        `*Boleto — ${descricao || 'Serviço'}*\n\nNome: *${nome}*\nValor: *${valorFmt}*\nVencimento: ${dataFmt}\n\n*Código de barras:*\n${boleto.codigoBarras}\n\nPDF: ${boleto.pdfUrl}`
      ).catch(() => {/* whatsapp opcional */})
    }

    return NextResponse.json({ ok: true, boleto })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
