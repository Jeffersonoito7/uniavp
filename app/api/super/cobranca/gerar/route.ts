import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { gerarCobrancaPix } from '@/lib/efi-engine'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function getSuperAdmin(userId: string, sb: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await sb.from('super_admins').select('id').eq('user_id', userId).eq('ativo', true).maybeSingle()
  return !!data
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const sb = createServiceRoleClient()
  if (!await getSuperAdmin(user.id, sb)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const { valor, descricao, vencimento, devedor_nome, devedor_doc } = body

  if (!valor || Number(valor) <= 0) return NextResponse.json({ error: 'Informe o valor.' }, { status: 400 })
  if (!vencimento) return NextResponse.json({ error: 'Informe a data de vencimento.' }, { status: 400 })

  try {
    const doc = String(devedor_doc ?? '').replace(/\D/g, '')
    const result = await gerarCobrancaPix({
      valor,
      descricao: descricao || 'Cobrança Universidade Oito7 Digital',
      vencimento,
      devedor: devedor_nome ? {
        nome: devedor_nome,
        cnpj: doc.length === 14 ? doc : undefined,
        cpf: doc.length === 11 ? doc : undefined,
      } : undefined,
    })

    await (sb as any).from('cobrancas_pix').insert({
      txid: result.txid,
      valor: Number(valor),
      descricao: descricao || 'Cobrança Universidade Oito7 Digital',
      vencimento,
      devedor_nome: devedor_nome ?? null,
      devedor_doc: doc || null,
      qr_code: result.qrCode,
      copia_e_cola: result.copiaECola,
      status: 'ATIVA',
      created_at: new Date().toISOString(),
    }).catch(() => {})

    return NextResponse.json({ ok: true, ...result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao gerar cobrança.' }, { status: 500 })
  }
}
