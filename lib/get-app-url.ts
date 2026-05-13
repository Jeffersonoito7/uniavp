import { createServiceRoleClient } from '@/lib/supabase-server'

let cached: string | null = null
let cacheAt = 0

export async function getAppUrl(): Promise<string> {
  // Cache por 60s para não bater no banco a cada requisição
  if (cached && Date.now() - cacheAt < 60_000) return cached

  try {
    const client = createServiceRoleClient()
    const { data } = await (client.from('configuracoes') as any)
      .select('valor')
      .eq('chave', 'dominio_customizado')
      .maybeSingle()

    const dominio = data?.valor ? JSON.parse(data.valor).replace(/^https?:\/\//, '') : ''
    if (dominio) {
      cached = `https://${dominio}`
      cacheAt = Date.now()
      return cached
    }
  } catch { /* usa env */ }

  cached = process.env.NEXT_PUBLIC_APP_URL || 'https://uniavp.autovaleprevencoes.org.br'
  cacheAt = Date.now()
  return cached
}
