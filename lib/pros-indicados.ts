export const LIMITE_PRO_GRATUITO = 20 // fallback padrão

export async function getLimitePROGratuito(admin: any): Promise<number> {
  try {
    const { data } = await admin.from('configuracoes')
      .select('valor').eq('chave', 'pros_gratuito_limite').maybeSingle()
    const v = parseInt(data?.valor ?? '')
    return isNaN(v) || v < 1 ? LIMITE_PRO_GRATUITO : v
  } catch { return LIMITE_PRO_GRATUITO }
}

export async function contarPROsAtivosIndicados(gestorId: string, admin: any): Promise<number> {
  const agora = new Date().toISOString()
  const { count } = await admin.from('gestores')
    .select('id', { count: 'exact', head: true })
    .eq('indicado_por_gestor_id', gestorId)
    .eq('ativo', true)
    .eq('status_assinatura', 'ativo')
    .gt('plano_vencimento', agora)
  return count ?? 0
}

export async function verificarPROGratuito(gestorId: string, admin: any): Promise<boolean> {
  const [total, limite] = await Promise.all([
    contarPROsAtivosIndicados(gestorId, admin),
    getLimitePROGratuito(admin),
  ])
  return total >= limite
}
