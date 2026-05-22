export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { getSiteConfig } from '@/lib/site-config'
import { headers } from 'next/headers'
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

export default async function GestorCaptacaoPage({ params, searchParams }: { params: { gestorWhatsapp: string }; searchParams?: { direto?: string; ref?: string; plano?: string } }) {
  const host = (await headers()).get('host') ?? ''
  const adminClient = createServiceRoleClient()
  const config = await getSiteConfig(host)

  const { data: gestor } = await (adminClient.from('gestores') as any)
    .select('nome, whatsapp, link_externo')
    .eq('whatsapp', params.gestorWhatsapp)
    .eq('ativo', true)
    .maybeSingle()

  if (!gestor) notFound()

  const { data: tenantRow } = await (adminClient.from('tenant_domains') as any)
    .select('tenant_id').eq('domain', host.replace(/:\d+$/, '')).maybeSingle()
  const tenantId = tenantRow?.tenant_id as string | null

  const cfgBase = (adminClient.from('configuracoes') as any).select('valor').eq('chave', 'captacao_video_id')
  const { data: videoConfig } = await (tenantId ? cfgBase.eq('tenant_id', tenantId) : cfgBase).maybeSingle()

  const cfgExtra = (adminClient.from('configuracoes') as any)
    .select('chave, valor')
    .in('chave', [
      'free_bloquear_video',
      'captacao_mostrar_parceiro', 'captacao_bloquear_parceiro', 'captacao_parceiro_titulo',
      'captacao_mostrar_app', 'captacao_bloquear_app',
      'app_ios_url', 'app_android_url',
    ])
  const { data: cfgsExtra } = await (tenantId ? cfgExtra.eq('tenant_id', tenantId) : cfgExtra)
  const cfgMap: Record<string, string> = {}
  for (const c of cfgsExtra ?? []) cfgMap[c.chave] = typeof c.valor === 'string' ? c.valor : JSON.stringify(c.valor ?? '').replace(/"/g, '')
  const bloquearVideo = cfgMap['free_bloquear_video'] !== 'false'
  const captacaoMostrarParceiro = cfgMap['captacao_mostrar_parceiro'] === 'true'
  const captacaoBloquearParceiro = cfgMap['captacao_bloquear_parceiro'] === 'true'
  const captacaoParceiroTitulo = cfgMap['captacao_parceiro_titulo'] || undefined
  const captacaoMostrarApp = cfgMap['captacao_mostrar_app'] === 'true'
  const captacaoBloquearApp = cfgMap['captacao_bloquear_app'] === 'true'
  const appIosUrl = cfgMap['app_ios_url'] || undefined
  const appAndroidUrl = cfgMap['app_android_url'] || undefined
  // JSONB pode vir como objeto parsed ou string raw — tenta os dois
  const valorRaw = videoConfig?.valor
  const valorStr = typeof valorRaw === 'string' ? valorRaw : JSON.stringify(valorRaw ?? '')
  const videoId = extrairIdYoutube(valorStr)
  const direto = searchParams?.direto === '1'
  const ref = searchParams?.ref ?? undefined
  const plano = searchParams?.plano === 'pro' ? 'pro' : undefined

  return (
    <FunilCaptacao
      gestorNome={gestor.nome}
      gestorWhatsapp={gestor.whatsapp}
      siteNome={config.nome}
      logoUrl={config.logoPaginaUrl || config.logoUrl}
      videoId={videoId}
      direto={direto}
      indicadorWhatsapp={ref}
      plano={plano}
      linkExterno={gestor.link_externo ?? undefined}
      bloquearVideo={bloquearVideo}
      captacaoMostrarParceiro={captacaoMostrarParceiro}
      captacaoBloquearParceiro={captacaoBloquearParceiro}
      captacaoParceiroTitulo={captacaoParceiroTitulo}
      captacaoMostrarApp={captacaoMostrarApp}
      captacaoBloquearApp={captacaoBloquearApp}
      appIosUrl={appIosUrl}
      appAndroidUrl={appAndroidUrl}
    />
  )
}
