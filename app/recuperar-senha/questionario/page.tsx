import { getSiteConfig } from '@/lib/site-config'
import { headers } from 'next/headers'
import QuestionarioForm from './QuestionarioForm'

export default async function RecuperarQuestionarioPage() {
  const host = (await headers()).get('host') ?? ''
  const config = await getSiteConfig(host)
  return (
    <QuestionarioForm
      logoUrl={config.logoPaginaUrl || config.logoUrl}
      siteNome={config.isDominioMaster ? '' : config.nome}
    />
  )
}
