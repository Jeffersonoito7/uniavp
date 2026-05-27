import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'
import { gerarPDFParaContrato } from '@/lib/contrato-gerar'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { numero_registro } = await req.json()
  if (!numero_registro) return NextResponse.json({ error: 'numero_registro obrigatório' }, { status: 400 })

  const { data: contrato } = await adminClient.from('contratos')
    .select('*')
    .eq('numero_registro', numero_registro)
    .maybeSingle()
  if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })

  const host = req.headers.get('host') ?? ''
  const result = await gerarPDFParaContrato(adminClient, contrato, host)

  if (!result.ok) return NextResponse.json({ error: result.erro }, { status: 500 })
  return NextResponse.json({ ok: true, pdf_url: result.pdfUrl })
}
