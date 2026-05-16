import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export const MIGRATIONS = [
  {
    id: '0031_otp_whatsapp',
    descricao: 'Verificação WhatsApp OTP — upgrade PRO',
    sql: `CREATE TABLE IF NOT EXISTS otp_whatsapp (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp   TEXT        NOT NULL,
  codigo     TEXT        NOT NULL,
  expira_em  TIMESTAMPTZ NOT NULL,
  usado      BOOLEAN     DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otp_whatsapp_wpp    ON otp_whatsapp(whatsapp);
CREATE INDEX IF NOT EXISTS idx_otp_whatsapp_expira ON otp_whatsapp(expira_em);`,
  },
  {
    id: '0032_gestor_indicado_por',
    descricao: 'PRO gratuito por rede — campo indicado_por_gestor_id em gestores',
    sql: `ALTER TABLE gestores ADD COLUMN IF NOT EXISTS indicado_por_gestor_id UUID REFERENCES gestores(id);
CREATE INDEX IF NOT EXISTS idx_gestores_indicado_por ON gestores(indicado_por_gestor_id);`,
  },
]

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createServiceRoleClient()
  const { data: sa } = await (admin.from('super_admins') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!sa) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const resultados = []
  for (const m of MIGRATIONS) {
    let aplicada = false
    if (m.id === '0031_otp_whatsapp') {
      const { error } = await (admin.from('otp_whatsapp') as any).select('id').limit(1)
      aplicada = !error
    }
    if (m.id === '0032_gestor_indicado_por') {
      const { data } = await (admin.from('gestores') as any).select('indicado_por_gestor_id').limit(1)
      aplicada = data !== null
    }
    resultados.push({ ...m, aplicada })
  }

  return NextResponse.json({ migrations: resultados })
}
