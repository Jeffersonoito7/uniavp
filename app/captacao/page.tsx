export const dynamic = 'force-dynamic'

import { createServiceRoleClient } from '@/lib/supabase-server'
import { getSiteConfig } from '@/lib/site-config'
import FunilCaptacao from '@/app/components/FunilCaptacao'

function extrairIdYoutube(valor?: string | null): string | null {
  if (!valor) return null
  const v = String(valor).replace(/"/g, '').trim()
  if (!v) return null
  const match = v.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/)
  if (match) return match[1]
  if (/^[a-zA-Z0-9_-]{11}$/.test(v)) return v
  const fallback = v.match(/[a-zA-Z0-9_-]{11}/)
  return fallback ? fallback[0] : null
}

export default async function CaptacaoPage() {
  const adminClient = createServiceRoleClient()
  const config = await getSiteConfig()

  const { data: videoConfig } = await (adminClient.from('configuracoes') as any)
    .select('valor').eq('chave', 'captacao_video_id').maybeSingle()
  const valorRaw = videoConfig?.valor
  const valorStr = typeof valorRaw === 'string' ? valorRaw : JSON.stringify(valorRaw ?? '')
  const videoId = extrairIdYoutube(valorStr)

  return (
    <FunilCaptacao
      siteNome={config.nome}
      logoUrl={config.logoPaginaUrl || config.logoUrl}
      videoId={videoId}
    />
  )
}
