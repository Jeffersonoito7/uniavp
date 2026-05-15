export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { getSiteConfig } from '@/lib/site-config'
import FunilCaptacao from '@/app/components/FunilCaptacao'

function extrairIdYoutube(valor?: string | null): string | null {
  if (!valor) return null
  const v = String(valor).replace(/"/g, '').trim()
  if (!v) return null
  // Aceita qualquer formato de URL YouTube
  const match = v.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/)
  if (match) return match[1]
  // ID direto com 11 caracteres
  if (/^[a-zA-Z0-9_-]{11}$/.test(v)) return v
  // Pega qualquer sequência de 11 chars alfanuméricos isolada
  const fallback = v.match(/[a-zA-Z0-9_-]{11}/)
  return fallback ? fallback[0] : null
}

export default async function GestorCaptacaoPage({ params, searchParams }: { params: { gestorWhatsapp: string }; searchParams?: { direto?: string } }) {
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
  // JSONB pode vir como objeto parsed ou string raw — tenta os dois
  const valorRaw = videoConfig?.valor
  const valorStr = typeof valorRaw === 'string' ? valorRaw : JSON.stringify(valorRaw ?? '')
  const videoId = extrairIdYoutube(valorStr)
  const direto = searchParams?.direto === '1'

  return (
    <FunilCaptacao
      gestorNome={gestor.nome}
      gestorWhatsapp={gestor.whatsapp}
      siteNome={config.nome}
      logoUrl={config.logoPaginaUrl || config.logoUrl}
      videoId={videoId}
      direto={direto}
    />
  )
}
