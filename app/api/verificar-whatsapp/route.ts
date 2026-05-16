import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

function gerarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  const { whatsapp, codigo } = body
  if (!whatsapp) return NextResponse.json({ error: 'WhatsApp obrigatório' }, { status: 400 })

  const wpp = String(whatsapp).replace(/\D/g, '')
  if (wpp.length < 10) return NextResponse.json({ error: 'Número inválido' }, { status: 400 })

  const admin = createServiceRoleClient()

  // ── CONFIRMAÇÃO DO CÓDIGO ────────────────────────────────────────
  if (codigo) {
    const { data: otp } = await (admin.from('otp_whatsapp') as any)
      .select('id, codigo, expira_em, usado')
      .eq('whatsapp', wpp)
      .eq('usado', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!otp) return NextResponse.json({ error: 'Código inválido ou expirado.' }, { status: 400 })
    if (new Date(otp.expira_em) < new Date()) return NextResponse.json({ error: 'Código expirado. Clique em "Reenviar".' }, { status: 400 })
    if (otp.codigo !== String(codigo).trim()) return NextResponse.json({ error: 'Código incorreto. Verifique e tente novamente.' }, { status: 400 })

    await (admin.from('otp_whatsapp') as any).update({ usado: true }).eq('id', otp.id)
    return NextResponse.json({ ok: true, verificado: true })
  }

  // ── ENVIO DO CÓDIGO ──────────────────────────────────────────────
  // Máximo 3 envios por número nos últimos 10 minutos (anti-spam)
  const dezMinAtras = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { count } = await (admin.from('otp_whatsapp') as any)
    .select('id', { count: 'exact', head: true })
    .eq('whatsapp', wpp)
    .gte('created_at', dezMinAtras)

  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde 10 minutos e tente novamente.' }, { status: 429 })
  }

  const novoCodigo = gerarCodigo()
  const expira = new Date(Date.now() + 10 * 60 * 1000)

  await (admin.from('otp_whatsapp') as any).insert({
    whatsapp: wpp,
    codigo: novoCodigo,
    expira_em: expira.toISOString(),
  })

  await enviarWhatsApp(
    wpp,
    `🔐 *Verificação de WhatsApp*\n\nSeu código de confirmação é:\n\n*${novoCodigo}*\n\n_Válido por 10 minutos. Não compartilhe com ninguém._`
  )

  return NextResponse.json({ ok: true })
}
