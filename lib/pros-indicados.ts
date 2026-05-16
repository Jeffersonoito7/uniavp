const LIMITE_PRO_GRATUITO = 20

export async function contarPROsAtivosIndicados(gestorId: string, admin: any): Promise<number> {
  const { count } = await (admin.from('gestores') as any)
    .select('id', { count: 'exact', head: true })
    .eq('indicado_por_gestor_id', gestorId)
    .eq('ativo', true)
    .eq('status_assinatura', 'ativo')
  return count ?? 0
}

export async function verificarPROGratuito(gestorId: string, admin: any): Promise<boolean> {
  const total = await contarPROsAtivosIndicados(gestorId, admin)
  return total >= LIMITE_PRO_GRATUITO
}

export { LIMITE_PRO_GRATUITO }
