import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { encCert, decCert, carregarCertificado } from '@/lib/nfse-engine'

export const dynamic = 'force-dynamic'

async function getSuperAdmin(userId: string, sb: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await sb.from('super_admins').select('id').eq('user_id', userId).eq('ativo', true).maybeSingle()
  return !!data
}

// GET: status do certificado
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const sb = createServiceRoleClient()
  if (!await getSuperAdmin(user.id, sb)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { data } = await (sb as any)
    .from('nfse_config')
    .select('cert_configurado, cert_valido_ate, cert_titular')
    .eq('id', 'default')
    .maybeSingle()

  return NextResponse.json({ configurado: data?.cert_configurado ?? false, validoAte: data?.cert_valido_ate ?? null, titular: data?.cert_titular ?? null })
}

// POST: upload do .pfx
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const sb = createServiceRoleClient()
  if (!await getSuperAdmin(user.id, sb)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const form = await req.formData()
  const file = form.get('certificado') as File | null
  const senha = (form.get('senha') as string) ?? ''

  if (!file) return NextResponse.json({ error: 'Arquivo .pfx obrigatório' }, { status: 400 })

  const bytes = Buffer.from(await file.arrayBuffer())

  let info: Awaited<ReturnType<typeof carregarCertificado>>
  try {
    info = carregarCertificado(bytes, senha)
  } catch (e: any) {
    return NextResponse.json({ error: 'Certificado ou senha inválidos. Verifique o arquivo .pfx e a senha.' }, { status: 400 })
  }

  const certEnc = encCert(bytes)
  const passEnc = encCert(Buffer.from(senha, 'utf8'))

  const { error } = await (sb as any).from('nfse_config').update({
    cert_enc: certEnc,
    cert_pass_enc: passEnc,
    cert_configurado: true,
    cert_valido_ate: info.validoAte?.toISOString() ?? null,
    cert_titular: info.titular,
    updated_at: new Date().toISOString(),
  }).eq('id', 'default')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, configurado: true, validoAte: info.validoAte, titular: info.titular })
}
