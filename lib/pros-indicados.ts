export const LIMITE_PRO_GRATUITO = 20

// Conta PROs ativos indicados por este gestor que estejam pagando em dia
// (status_assinatura = 'ativo' + plano não vencido)
export async function contarPROsAtivosIndicados(gestorId: string, admin: any): Promise<number> {
  const agora = new Date().toISOString()
  const { count } = await (admin.from('gestores') as any)
    .select('id', { count: 'exact', head: true })
    .eq('indicado_por_gestor_id', gestorId)
    .eq('ativo', true)
    .eq('status_assinatura', 'ativo')
    .gt('plano_vencimento', agora)  // pagando em dia — plano ainda válido
  return count ?? 0
}

// Retorna true se o gestor tem isenção de mensalidade:
// - Ele mesmo deve ser PRO ativo com plano em dia
// - E ter >= 20 PROs ativos indicados por ele, também pagando em dia
export async function verificarPROGratuito(gestorId: string, admin: any): Promise<boolean> {
  // Verifica se o próprio gestor está ativo e pagando
  const agora = new Date().toISOString()
  const { data: gestorAtual } = await (admin.from('gestores') as any)
    .select('status_assinatura, plano_vencimento')
    .eq('id', gestorId)
    .maybeSingle()

  if (!gestorAtual) return false
  const gestorEhPro = gestorAtual.status_assinatura === 'ativo' && gestorAtual.plano_vencimento && gestorAtual.plano_vencimento > agora
  if (!gestorEhPro) return false

  // Verifica se tem 20 PROs indicados ativos pagando
  const total = await contarPROsAtivosIndicados(gestorId, admin)
  return total >= LIMITE_PRO_GRATUITO
}
