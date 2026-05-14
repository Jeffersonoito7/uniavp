import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { getSiteConfig } from '@/lib/site-config'
import FunilCaptacao from '@/app/components/FunilCaptacao'

export default async function GestorCaptacaoPage({ params }: { params: { gestorWhatsapp: string } }) {
  const adminClient = createServiceRoleClient()
  const config = await getSiteConfig()

  const { data: gestor } = await (adminClient.from('gestores') as any)
    .select('nome, whatsapp')
    .eq('whatsapp', params.gestorWhatsapp)
    .eq('ativo', true)
    .maybeSingle()

  if (!gestor) notFound()

  const { data: videoConfig } = await (adminClient.from('configuracoes') as any)
    .select('valor').eq('chave', 'captacao_video_id').maybeSingle()
  const videoId = videoConfig?.valor ? String(videoConfig.valor).replace(/"/g, '') : null

  return (
    <FunilCaptacao
      gestorNome={gestor.nome}
      gestorWhatsapp={gestor.whatsapp}
      siteNome={config.nome}
      logoUrl={config.logoPaginaUrl || config.logoUrl}
      videoId={videoId}
    />
  )
}
