import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

function gerarCodigo(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function buscarInstanciaAdmin(adminClient: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await (adminClient.from('admins') as any)
    .select('whatsapp_instancia').eq('ativo', true).not('whatsapp_instancia', 'is', null).limit(1).maybeSingle()
  return data?.whatsapp_instancia ?? null
}


export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()

  // Busca whatsapp do usuário (aluno, gestor ou admin)
  let whatsapp: string | null = null
  let instanciaEspecifica: string | null = null

  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('whatsapp').eq('user_id', user.id).maybeSingle()
  if (aluno?.whatsapp) whatsapp = aluno.whatsapp

  if (!whatsapp) {
    const { data: gestor } = await (adminClient.from('gestores') as any)
      .select('whatsapp, whatsapp_instancia').eq('user_id', user.id).maybeSingle()
    if (gestor?.whatsapp) {
      whatsapp = gestor.whatsapp
      instanciaEspecifica = gestor.whatsapp_instancia ?? null
    }
  }

  if (!whatsapp) {
    const { data: adminRec } = await (adminClient.from('admins') as any)
      .select('whatsapp, whatsapp_instancia').eq('user_id', user.id).eq('ativo', true).maybeSingle()
    if (adminRec?.whatsapp) {
      whatsapp = adminRec.whatsapp
      instanciaEspecifica = adminRec.whatsapp_instancia ?? null
    }
  }

  // Invalida OTPs anteriores
  await (adminClient.from('verificacao_otp') as any)
    .update({ usado: true })
    .eq('user_id', user.id)
    .eq('usado', false)

  const codigo = gerarCodigo()
  const expira_em = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  let enviado = false

  // Envia via WhatsApp — usa instância específica do usuário ou a do admin como fallback
  if (whatsapp) {
    const instancia = instanciaEspecifica ?? await buscarInstanciaAdmin(adminClient)
    const msg = `🔐 *Código de verificação*\n\nSeu código é: *${codigo}*\n\nVálido por 10 minutos. Não compartilhe com ninguém.`
    enviado = await enviarWhatsApp(whatsapp, msg, instancia)
  }

  // Salva OTP no banco
  await (adminClient.from('verificacao_otp') as any)
    .insert({ user_id: user.id, codigo, expira_em, canal: 'whatsapp' })

  const wppMask = whatsapp
    ? `WhatsApp *${whatsapp.slice(-4).padStart(whatsapp.length, '*')}`
    : 'WhatsApp'

  return NextResponse.json({
    ok: true,
    canal: 'whatsapp',
    destino: wppMask,
    // Mostra código na tela quando Evolution API não está configurada (dev/teste)
    ...(!enviado ? { codigoDev: codigo } : {})
  })
}
