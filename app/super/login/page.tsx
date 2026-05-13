import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import SuperLoginForm from './SuperLoginForm'

const DOMINIO_MASTER = 'universidade.oito7digital.com.br'

export default async function SuperLoginPage() {
  const host = headers().get('host')?.replace(/:\d+$/, '') ?? ''
  if (host !== DOMINIO_MASTER && host !== 'localhost') {
    redirect('/login')
  }
  return <SuperLoginForm />
}
