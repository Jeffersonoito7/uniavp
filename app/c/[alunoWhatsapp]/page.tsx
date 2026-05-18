export const dynamic = 'force-dynamic'

import { createServiceRoleClient } from '@/lib/supabase-server'
import { getSiteConfig } from '@/lib/site-config'
import FunilCaptacao from '@/app/components/FunilCaptacao'
import { redirect } from 'next/navigation'

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

export default async function FreeCaptacaoPage({
  params,
  searchParams,
}: {
  params: { alunoWhatsapp: string }
  searchParams?: { direto?: string; plano?: string }
}) {
  const adminClient = createServiceRoleClient()
  const config = await getSiteConfig()

  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('nome, whatsapp, link_externo')
    .eq('whatsapp', params.alunoWhatsapp)
    .maybeSingle()

  if (!aluno) redirect('/captacao')

  const { data: videoConfig } = await (adminClient.from('configuracoes') as any)
    .select('valor').eq('chave', 'captacao_video_id').maybeSingle()

  const { data: bloquearConfig } = await (adminClient.from('configuracoes') as any)
    .select('valor').eq('chave', 'free_bloquear_video').maybeSingle()
  const bloquearVideo = bloquearConfig?.valor !== 'false'

  const valorRaw = videoConfig?.valor
  const valorStr = typeof valorRaw === 'string' ? valorRaw : JSON.stringify(valorRaw ?? '')
  const videoId = extrairIdYoutube(valorStr)
  const direto = searchParams?.direto === '1'
  const plano = searchParams?.plano === 'pro' ? 'pro' : undefined

  return (
    <FunilCaptacao
      gestorNome={aluno.nome}
      siteNome={config.nome}
      logoUrl={config.logoPaginaUrl || config.logoUrl}
      videoId={videoId}
      direto={direto}
      indicadorWhatsapp={aluno.whatsapp}
      plano={plano}
      linkExterno={aluno.link_externo ?? undefined}
      bloquearVideo={bloquearVideo}
    />
  )
}
