import { redirect } from 'next/navigation'
export default function ConsultorLoginRedirect() {
  redirect('/entrar?p=free')
}
