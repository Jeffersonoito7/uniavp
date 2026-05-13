import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { consultarVeiculo } from '@/lib/providers'
import { calcularScore } from '@/lib/score'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { placa, chassi } = await req.json()
    const input = placa ?? chassi
    const tipo  = placa ? 'placa' : 'chassi'

    if (!input) {
      return NextResponse.json({ error: 'Placa ou chassi obrigatório' }, { status: 400 })
    }

    const { provider, data } = await consultarVeiculo(input, tipo)

    // Calcular score de risco
    const { score, nivel, fatores } = calcularScore(data)

    // TODO: salvar resultado no Supabase (consultations table)
    // TODO: salvar em cache (vehicles_cache) para evitar re-consulta

    return NextResponse.json({
      success: true,
      provider,
      score,
      nivel,
      fatores,
      data,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
