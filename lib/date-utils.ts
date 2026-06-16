/** Adiciona N meses calendário a uma data. Ex: 31/jan + 1 mês = 28/fev, não 02/mar. */
export function addMeses(data: Date, meses: number): Date {
  const d = new Date(data)
  d.setMonth(d.getMonth() + meses)
  return d
}

/** Retorna ISO string com N meses a partir de agora. */
export function vencimentoMeses(meses: number): string {
  return addMeses(new Date(), meses).toISOString()
}
