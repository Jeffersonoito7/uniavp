import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { consultarCobranca } from '@/lib/efi-engine'

export const dynamic = 'force-dynamic'

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

  const { txid } = await req.json()
  if (!txid) return NextResponse.json({ error: 'txid obrigatório.' }, { status: 400 })

  try {
    const result = await consultarCobranca(txid)
    if (result.pago) {
      await (sb as any).from('cobrancas_pix').update({ status: 'CONCLUIDA', valor_pago: result.valorPago, pago_em: new Date().toISOString() }).eq('txid', txid).catch(() => {})
    }
    return NextResponse.json({ ok: true, ...result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao consultar.' }, { status: 500 })
  }
}
