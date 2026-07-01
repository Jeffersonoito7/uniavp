export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'

// Redireciona /free/[whatsapp] → /aluno/[whatsapp]
// Mantém compatibilidade com links antigos enviados por WhatsApp
export default function FreeRedirect({ params }: { params: { whatsapp: string } }) {
 redirect(`/aluno/${params.whatsapp}`)
}
