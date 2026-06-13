import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import SuperLoginForm from './SuperLoginForm'

import { DOMINIO_MASTER } from '@/lib/constants'

export default async function SuperLoginPage() {
 const host = headers().get('host')?.replace(/:\d+$/, '') ?? ''
 if (host !== DOMINIO_MASTER && host !== 'localhost') {
 redirect('/entrar?p=adm')
 }
 return <SuperLoginForm />
}
