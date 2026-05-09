import { getSiteConfig } from '@/lib/site-config'
import RedefinirSenhaForm from './RedefinirSenhaForm'

export default async function RedefinirSenhaPage() {
  const config = await getSiteConfig()
  return (
    <RedefinirSenhaForm
      logoUrl={config.logoPaginaUrl || config.logoUrl || '/logo.png'}
      siteNome={config.nome}
    />
  )
}
