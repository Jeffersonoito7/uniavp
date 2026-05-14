import { createServiceRoleClient } from '@/lib/supabase-server'
import { getSiteConfig } from '@/lib/site-config'
import FunilCaptacao from '@/app/components/FunilCaptacao'

export default async function CaptacaoPage() {
  const adminClient = createServiceRoleClient()
  const config = await getSiteConfig()

  const { data: videoConfig } = await (adminClient.from('configuracoes') as any)
    .select('valor').eq('chave', 'captacao_video_id').maybeSingle()
  const videoId = videoConfig?.valor ? String(videoConfig.valor).replace(/"/g, '') : null

  return (
    <FunilCaptacao
      siteNome={config.nome}
      logoUrl={config.logoPaginaUrl || config.logoUrl}
      videoId={videoId}
    />
  )
}
