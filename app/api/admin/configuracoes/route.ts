import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getTenantId } from '@/lib/tenant'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await adminClient.from('admins')
    .select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  const { data: superRecord } = await adminClient.from('super_admins')
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord && !superRecord) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const host = req.headers.get('host') ?? ''
  const tenantId = adminRecord?.tenant_id ?? await getTenantId(host)

  let body: { chave: string; valor: string }[]
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body muito grande ou inválido' }, { status: 400 })
  }
  if (!Array.isArray(body)) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

  const erros: string[] = []

  for (const { chave, valor } of body) {
    if (!chave) continue
    try {
      if (tenantId) {
        const { data: updated, error: updErr } = await adminClient.from('configuracoes')
          .update({ valor })
          .eq('chave', chave)
          .eq('tenant_id', tenantId)
          .select('chave')
        if (updErr) { erros.push(`${chave}: ${updErr.message}`); continue }
        if (!updated || updated.length === 0) {
          const { error: insErr } = await adminClient.from('configuracoes')
            .insert({ chave, valor, tenant_id: tenantId })
          if (insErr) erros.push(`${chave}: ${insErr.message}`)
        }
      } else {
        const { data: existente } = await adminClient.from('configuracoes')
          .select('chave').eq('chave', chave).is('tenant_id', null).maybeSingle()
        if (existente) {
          const { error: updErr } = await adminClient.from('configuracoes')
            .update({ valor }).eq('chave', chave).is('tenant_id', null)
          if (updErr) erros.push(`${chave}: ${updErr.message}`)
        } else {
          const { error: insErr } = await adminClient.from('configuracoes')
            .insert({ chave, valor })
          if (insErr) erros.push(`${chave}: ${insErr.message}`)
        }
      }
    } catch (e: any) {
      erros.push(`${chave}: ${e?.message ?? 'erro desconhecido'}`)
    }
  }

  if (erros.length > 0) {
    return NextResponse.json({ error: erros.join(' | ') }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
