import { getSiteConfig } from '@/lib/site-config'
import RecuperarSenhaForm from './RecuperarSenhaForm'

export default async function RecuperarSenhaPage() {
  const config = await getSiteConfig()
  return (
    <RecuperarSenhaForm
      logoUrl={config.logoPaginaUrl || config.logoUrl || '/logo.png'}
      siteNome={config.isDominioMaster ? '' : config.nome}
    />
  )
}
