import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { getSiteConfig } from '@/lib/site-config'
import GestorCaptacaoForm from './GestorCaptacaoForm'

export default async function GestorCaptacaoPage({ params }: { params: { gestorWhatsapp: string } }) {
  const adminClient = createServiceRoleClient()
  const [config] = await Promise.all([getSiteConfig()])

  const { data: gestor } = await (adminClient.from('gestores') as any)
    .select('nome, whatsapp')
    .eq('whatsapp', params.gestorWhatsapp)
    .eq('ativo', true)
    .maybeSingle()

  if (!gestor) notFound()

  return (
    <GestorCaptacaoForm
      gestor={gestor}
      siteNome={config.nome}
      logoUrl={config.logoPaginaUrl || config.logoUrl || '/logo.png'}
    />
  )
}
