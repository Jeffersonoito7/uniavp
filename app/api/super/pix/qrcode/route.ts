import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import QRCode from 'qrcode'

export const dynamic = 'force-dynamic'

function crc16(str: string): string {
  let crc = 0xFFFF
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function tlv(id: string, value: string): string {
  return id + String(value.length).padStart(2, '0') + value
}

function pixPayload(chave: string, nome: string, cidade: string, valor: number, txid: string): string {
  const nomeLimpo = nome.normalize('NFD').replace(/[̀-ͯ]/g, '').substring(0, 25).toUpperCase()
  const cidadeLimpa = cidade.normalize('NFD').replace(/[̀-ͯ]/g, '').substring(0, 15).toUpperCase()
  const txidLimpo = (txid || '***').replace(/\W/g, '').substring(0, 25) || '***'
  const merchantAccount = tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', chave)
  const additionalData = tlv('05', txidLimpo)
  let payload =
    tlv('00', '01') +
    tlv('01', valor > 0 ? '12' : '11') +
    tlv('26', merchantAccount) +
    '52040000' +
    '5303986' +
    (valor > 0 ? tlv('54', valor.toFixed(2)) : '') +
    '5802BR' +
    tlv('59', nomeLimpo) +
    tlv('60', cidadeLimpa) +
    tlv('62', additionalData) +
    '6304'
  return payload + crc16(payload)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const sb = createServiceRoleClient()
  const { data: admin } = await sb.from('super_admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!admin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { valor, descricao, chave_override, nome_override } = await req.json()
  if (!valor || Number(valor) <= 0) return NextResponse.json({ error: 'Informe o valor.' }, { status: 400 })

  let chave = chave_override?.trim()
  let nome = nome_override?.trim() || 'FAVORECIDO'
  let cidade = 'PETROLINA'

  if (!chave) {
   const { data: cfg } = await (sb as any).from('nfse_config').select('pix_key,pix_nome,pix_cidade').eq('id', 'default').maybeSingle()
   if (!cfg?.pix_key) return NextResponse.json({ error: 'Chave PIX não configurada.' }, { status: 400 })
   chave = cfg.pix_key
   nome = cfg.pix_nome || nome
   cidade = cfg.pix_cidade || cidade
  }

  const valorNum = Number(valor)
  const txid = descricao ? descricao.replace(/\W/g, '').substring(0, 25) : '***'
  const payload = pixPayload(chave, nome, cidade, valorNum, txid)
  const qrDataUrl = await QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 1, width: 300 })

  return NextResponse.json({ ok: true, payload, qrDataUrl, chave, nome, valor: valorNum })
}
