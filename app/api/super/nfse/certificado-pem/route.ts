import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { encCert, carregarCertificadoDePem } from '@/lib/nfse-engine'

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

  const form = await req.formData()
  const keyFile = form.get('key_pem') as File | null
  const certFile = form.get('cert_pem') as File | null

  if (!keyFile || !certFile) {
    return NextResponse.json({ error: 'Arquivos key.pem e cert.pem são obrigatórios.' }, { status: 400 })
  }

  const keyPem = Buffer.from(await keyFile.arrayBuffer()).toString('utf8')
  const certPem = Buffer.from(await certFile.arrayBuffer()).toString('utf8')

  if (!keyPem.includes('PRIVATE KEY')) {
    return NextResponse.json({ error: 'Arquivo de chave inválido. Deve conter BEGIN PRIVATE KEY ou BEGIN RSA PRIVATE KEY.' }, { status: 400 })
  }
  if (!certPem.includes('CERTIFICATE')) {
    return NextResponse.json({ error: 'Arquivo de certificado inválido. Deve conter BEGIN CERTIFICATE.' }, { status: 400 })
  }

  let info: Awaited<ReturnType<typeof carregarCertificadoDePem>>
  try {
    info = carregarCertificadoDePem(keyPem, certPem)
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro ao ler os arquivos PEM: ' + (e?.message ?? '') }, { status: 400 })
  }

  const keyEnc = encCert(Buffer.from(keyPem, 'utf8'))
  const certEnc = encCert(Buffer.from(certPem, 'utf8'))

  const { error } = await (sb as any).from('nfse_config').update({
    key_pem_enc: keyEnc,
    cert_pem_enc: certEnc,
    cert_configurado: true,
    cert_valido_ate: info.validoAte?.toISOString() ?? null,
    cert_titular: info.titular,
    updated_at: new Date().toISOString(),
  }).eq('id', 'default')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, validoAte: info.validoAte, titular: info.titular })
}
