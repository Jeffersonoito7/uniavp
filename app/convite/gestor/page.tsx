import { getSiteConfig } from '@/lib/site-config'
import ConviteGestorForm from './ConviteGestorForm'

export default async function ConviteGestorPage() {
  const config = await getSiteConfig()
  return (
    <ConviteGestorForm
      siteNome={config.nome}
      logoUrl={config.logoPaginaUrl || config.logoUrl}
    />
  )
}
