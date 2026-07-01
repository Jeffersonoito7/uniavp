export const dynamic = 'force-dynamic'

import { createServiceRoleClient } from '@/lib/supabase-server'
import { getSiteConfig } from '@/lib/site-config'
import { headers } from 'next/headers'
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
 const host = (await headers()).get('host') ?? ''
 const adminClient = createServiceRoleClient()
 const config = await getSiteConfig(host)

 const { data: tenantRow } = await adminClient.from('tenant_domains')
 .select('tenant_id').eq('domain', host.replace(/:\d+$/, '')).maybeSingle()
 const tenantId = tenantRow?.tenant_id as string | null

 const tq = (q: any) => tenantId ? q.eq('tenant_id', tenantId) : q

 const { data: aluno } = await adminClient.from('alunos')
 .select('nome, whatsapp, link_externo')
 .eq('whatsapp', params.alunoWhatsapp)
 .maybeSingle()

 if (!aluno) redirect('/captacao')

 const { data: videoConfig } = await tq(adminClient.from('configuracoes')
 .select('valor').eq('chave', 'captacao_video_id')).maybeSingle()

 const { data: cfgsExtra } = await tq(adminClient.from('configuracoes')
 .select('chave, valor')
 .in('chave', [
   'free_bloquear_video',
   'captacao_mostrar_parceiro', 'captacao_bloquear_parceiro', 'captacao_parceiro_titulo',
   'captacao_mostrar_app', 'captacao_bloquear_app',
   'captacao_link_externo',
   'app_ios_url', 'app_android_url',
 ]))
 const cfgMap: Record<string, string> = {}
 for (const c of cfgsExtra ?? []) {
   cfgMap[c.chave] = typeof c.valor === 'string' ? c.valor : JSON.stringify(c.valor ?? '').replace(/"/g, '')
 }

 const bloquearVideo = cfgMap['free_bloquear_video'] !== 'false'
 const captacaoMostrarParceiro = cfgMap['captacao_mostrar_parceiro'] === 'true'
 const captacaoBloquearParceiro = cfgMap['captacao_bloquear_parceiro'] === 'true'
 const captacaoParceiroTitulo = cfgMap['captacao_parceiro_titulo'] || undefined
 const captacaoMostrarApp = cfgMap['captacao_mostrar_app'] === 'true'
 const captacaoBloquearApp = cfgMap['captacao_bloquear_app'] === 'true'
 const appIosUrl = cfgMap['app_ios_url'] || undefined
 const appAndroidUrl = cfgMap['app_android_url'] || undefined

 // Link parceiro: proprio aluno tem prioridade; fallback para o link global da plataforma
 const linkExterno = aluno.link_externo || cfgMap['captacao_link_externo'] || undefined

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
   corFundo={config.corFundo}
   videoId={videoId}
   direto={direto}
   indicadorWhatsapp={aluno.whatsapp}
   plano={plano}
   linkExterno={linkExterno}
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
