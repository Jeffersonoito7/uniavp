import type { createServiceRoleClient } from '@/lib/supabase-server'

type AdminClient = ReturnType<typeof createServiceRoleClient>

export const LIMITE_PRO_GRATUITO = 20

export async function getLimitePROGratuito(admin: AdminClient, tenantId?: string | null): Promise<number> {
  try {
    let q = admin.from('configuracoes').select('valor').eq('chave', 'pros_gratuito_limite')
    if (tenantId) q = q.eq('tenant_id', tenantId)
    else q = q.is('tenant_id', null)
    const { data } = await q.maybeSingle()
    const v = parseInt(String(data?.valor ?? ''))
    return isNaN(v) || v < 1 ? LIMITE_PRO_GRATUITO : v
  } catch { return LIMITE_PRO_GRATUITO }
}

/**
 * Conta PROs ativos que foram indicados por este gestor.
 *
 * Há dois caminhos de captação que precisam ser cobertos:
 *
 * Path A — o indicador já era PRO quando o indicado assinou o PRO.
 *   Nesse caso indicado_por_gestor_id foi preenchido no momento da assinatura.
 *
 * Path B — o indicador era ainda FREE quando captou o indicado via link /c/[wpp].
 *   Nesse caso indicado_por_gestor_id ficou null. O vínculo precisa ser rastreado
 *   pela cadeia: indicadores → alunos.indicador_id → gestores.whatsapp.
 *
 * Os resultados são unidos por Set para evitar dupla contagem caso o mesmo gestor
 * apareça nos dois caminhos.
 */
export async function contarPROsAtivosIndicados(
  gestorId: string,
  gestorWhatsapp: string,
  admin: AdminClient
): Promise<number> {
  const agora = new Date().toISOString()
  const gestorIdsEncontrados = new Set<string>()

  // ── Path A: vínculo direto por indicado_por_gestor_id ─────────────────────
  const { data: pathA } = await admin
    .from('gestores')
    .select('id')
    .eq('indicado_por_gestor_id', gestorId)
    .eq('ativo', true)
    .eq('status_assinatura', 'ativo')
    .gt('plano_vencimento', agora)

  for (const g of pathA ?? []) gestorIdsEncontrados.add(g.id)

  // ── Path B: captados via link FREE (indicador_id → alunos → gestores) ─────
  const wppSemDDI = gestorWhatsapp.startsWith('55') && gestorWhatsapp.length > 11
    ? gestorWhatsapp.slice(2)
    : gestorWhatsapp
  const wppComDDI = gestorWhatsapp.startsWith('55') ? gestorWhatsapp : `55${gestorWhatsapp}`
  const variacoes = [...new Set([gestorWhatsapp, wppSemDDI, wppComDDI])]

  const { data: indicadorRows } = await admin
    .from('indicadores')
    .select('id')
    .eq('tipo', 'consultor')
    .in('whatsapp', variacoes)

  if (indicadorRows?.length) {
    const indicadorIds = indicadorRows.map(r => r.id)

    const { data: alunosIndicados } = await admin
      .from('alunos')
      .select('whatsapp')
      .in('indicador_id', indicadorIds)

    if (alunosIndicados?.length) {
      const whatsapps = [...new Set(alunosIndicados.map(a => a.whatsapp))]

      const { data: pathB } = await admin
        .from('gestores')
        .select('id')
        .in('whatsapp', whatsapps)
        .eq('ativo', true)
        .eq('status_assinatura', 'ativo')
        .gt('plano_vencimento', agora)

      for (const g of pathB ?? []) gestorIdsEncontrados.add(g.id)
    }
  }

  return gestorIdsEncontrados.size
}

export async function verificarPROGratuito(
  gestorId: string,
  gestorWhatsapp: string,
  admin: AdminClient,
  tenantId?: string | null
): Promise<boolean> {
  const [total, limite] = await Promise.all([
    contarPROsAtivosIndicados(gestorId, gestorWhatsapp, admin),
    getLimitePROGratuito(admin, tenantId),
  ])
  return total >= limite
}
