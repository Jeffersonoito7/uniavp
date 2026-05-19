export const LIMITE_PRO_GRATUITO = 20

// Conta PROs ativos indicados por este gestor que estejam pagando em dia
export async function contarPROsAtivosIndicados(gestorId: string, admin: any): Promise<number> {
  const agora = new Date().toISOString()
  const { count } = await (admin.from('gestores') as any)
    .select('id', { count: 'exact', head: true })
    .eq('indicado_por_gestor_id', gestorId)
    .eq('ativo', true)
    .eq('status_assinatura', 'ativo')
    .gt('plano_vencimento', agora)
  return count ?? 0
}

// O gestor É o PRO — isenção se tiver >= 20 PROs indicados ativos e pagando em dia
export async function verificarPROGratuito(gestorId: string, admin: any): Promise<boolean> {
  const total = await contarPROsAtivosIndicados(gestorId, admin)
  return total >= LIMITE_PRO_GRATUITO
}
