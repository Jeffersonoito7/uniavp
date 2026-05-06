// Orquestrador de providers
// Tenta AvaliService → fallback ConsultarPlaca → fallback mock
import { consultarPorPlaca, consultarPorChassi } from './avaliservice'
import { consultarVeiculo as consultarPlacaAlt } from './consultarplaca'
import { getFipePorPlaca } from './brasilapi'

export async function consultarVeiculo(input: string, tipo: 'placa' | 'chassi' = 'placa') {
  try {
    const data = tipo === 'placa'
      ? await consultarPorPlaca(input)
      : await consultarPorChassi(input)

    // Enriquecer com FIPE gratuita da BrasilAPI se não vier do provider
    if (!data.fipe?.valorAtual) {
      const fipe = await getFipePorPlaca(input).catch(() => null)
      if (fipe) data.fipe = { ...data.fipe, ...fipe }
    }

    return { provider: 'avaliservice', data }
  } catch {
    // Fallback para ConsultarPlaca
    try {
      const data = await consultarPlacaAlt(input)
      if (data) return { provider: 'consultarplaca', data }
    } catch { /* segue */ }

    throw new Error('Nenhum provider disponível. Configure AVALISERVICE_API_KEY ou CONSULTARPLACA_API_KEY.')
  }
}
