import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// POST /api/admin/reparar-tenant
// Alinha todos os admins sem tenant_id ao tenant do admin logado
// E migra modulos/aulas sem tenant_id para o tenant correto
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()

  // Verifica quem e o admin logado e pega o tenant dele
  const { data: eu } = await adminClient.from('admins')
    .select('id, nome, tenant_id, role')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .maybeSingle()

  if (!eu) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  if (!eu.tenant_id) return NextResponse.json({ error: 'Sua conta não tem tenant_id definido. Use a conta principal.' }, { status: 400 })

  const tenantId = eu.tenant_id
  const log: string[] = []

  // 1. Alinha admins sem tenant_id
  const { data: adminsSemTenant } = await adminClient.from('admins')
    .select('id, nome')
    .is('tenant_id', null)
    .eq('ativo', true)

  if (adminsSemTenant && adminsSemTenant.length > 0) {
    const ids = adminsSemTenant.map(a => a.id)
    const { error } = await adminClient.from('admins')
      .update({ tenant_id: tenantId })
      .in('id', ids)
    if (error) {
      log.push(`ERRO ao atualizar admins: ${error.message}`)
    } else {
      for (const a of adminsSemTenant) {
        log.push(`Admin "${a.nome}" → tenant_id definido`)
      }
    }
  } else {
    log.push('Nenhum admin sem tenant_id encontrado')
  }

  // 2. Migra modulos sem tenant_id para o tenant correto
  const { data: modulosSemTenant } = await adminClient.from('modulos')
    .select('id, titulo')
    .is('tenant_id', null)

  if (modulosSemTenant && modulosSemTenant.length > 0) {
    const ids = modulosSemTenant.map(m => m.id)
    const { error } = await adminClient.from('modulos')
      .update({ tenant_id: tenantId })
      .in('id', ids)
    if (error) {
      log.push(`ERRO ao atualizar modulos: ${error.message}`)
    } else {
      for (const m of modulosSemTenant) {
        log.push(`Módulo "${m.titulo}" → tenant_id definido`)
      }
    }
  } else {
    log.push('Nenhum módulo sem tenant_id encontrado')
  }

  // 3. Migra aulas sem tenant_id
  const { data: aulasSemTenant, count } = await adminClient.from('aulas')
    .select('id', { count: 'exact' })
    .is('tenant_id', null)

  if (aulasSemTenant && aulasSemTenant.length > 0) {
    const ids = aulasSemTenant.map(a => a.id)
    const { error } = await adminClient.from('aulas')
      .update({ tenant_id: tenantId })
      .in('id', ids)
    if (error) {
      log.push(`ERRO ao atualizar aulas: ${error.message}`)
    } else {
      log.push(`${count ?? aulasSemTenant.length} aula(s) sem tenant → tenant_id definido`)
    }
  } else {
    log.push('Nenhuma aula sem tenant_id encontrada')
  }

  return NextResponse.json({ ok: true, tenant_id_aplicado: tenantId, log })
}
