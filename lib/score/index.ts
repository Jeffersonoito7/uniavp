// Calculador de Score de Risco (0-100)
// Quanto maior, menor o risco

export interface VeiculoData {
  restricoes?: {
    renajud?: boolean
    alienacao?: boolean
    rouboFurto?: boolean
    leilao?: boolean
    sinistro?: boolean
    multasDebitos?: number
  }
  alteracoes?: {
    chassi?: boolean
    motor?: boolean
    cor?: boolean
  }
  gravame?: { ativo: boolean }
  situacao?: string
}

export function calcularScore(data: VeiculoData): {
  score: number
  nivel: 'baixo' | 'medio' | 'alto'
  fatores: { label: string; impacto: number; ok: boolean }[]
} {
  let score = 100
  const fatores = []

  // RENAJUD (-25 pontos)
  if (data.restricoes?.renajud) {
    score -= 25
    fatores.push({ label: 'Restrição RENAJUD ativa', impacto: -25, ok: false })
  } else {
    fatores.push({ label: 'Sem restrição RENAJUD', impacto: 0, ok: true })
  }

  // Roubo/Furto (-30 pontos)
  if (data.restricoes?.rouboFurto) {
    score -= 30
    fatores.push({ label: 'Registro de roubo/furto', impacto: -30, ok: false })
  } else {
    fatores.push({ label: 'Sem registro de roubo/furto', impacto: 0, ok: true })
  }

  // Leilão (-20 pontos)
  if (data.restricoes?.leilao) {
    score -= 20
    fatores.push({ label: 'Histórico de leilão', impacto: -20, ok: false })
  } else {
    fatores.push({ label: 'Sem histórico de leilão', impacto: 0, ok: true })
  }

  // Sinistro (-15 pontos)
  if (data.restricoes?.sinistro) {
    score -= 15
    fatores.push({ label: 'Indício de sinistro', impacto: -15, ok: false })
  } else {
    fatores.push({ label: 'Sem indício de sinistro', impacto: 0, ok: true })
  }

  // Alienação (-5 pontos — não é necessariamente ruim)
  if (data.restricoes?.alienacao) {
    score -= 5
    fatores.push({ label: 'Alienação fiduciária', impacto: -5, ok: false })
  }

  // Alterações no chassi/motor (-20 pontos)
  if (data.alteracoes?.chassi || data.alteracoes?.motor) {
    score -= 20
    fatores.push({ label: 'Alteração em chassi ou motor', impacto: -20, ok: false })
  }

  // Multas/débitos (-5 pontos)
  if ((data.restricoes?.multasDebitos ?? 0) > 0) {
    score -= 5
    fatores.push({ label: 'Débitos de multas', impacto: -5, ok: false })
  }

  score = Math.max(0, Math.min(100, score))

  return {
    score,
    nivel: score >= 80 ? 'baixo' : score >= 60 ? 'medio' : 'alto',
    fatores,
  }
}
