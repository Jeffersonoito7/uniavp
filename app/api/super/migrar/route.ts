import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const MIGRATIONS = [
  {
    id: '0031_otp_whatsapp',
    descricao: 'Verificação WhatsApp OTP — upgrade PRO',
    sql: `CREATE TABLE IF NOT EXISTS otp_whatsapp (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, whatsapp TEXT NOT NULL, codigo TEXT NOT NULL, expira_em TIMESTAMPTZ NOT NULL, usado BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW()); CREATE INDEX IF NOT EXISTS idx_otp_whatsapp_wpp ON otp_whatsapp(whatsapp); CREATE INDEX IF NOT EXISTS idx_otp_whatsapp_expira ON otp_whatsapp(expira_em);`,
  },
  {
    id: '0032_gestor_indicado_por',
    descricao: 'PRO gratuito por rede — campo indicado_por_gestor_id em gestores',
    sql: `ALTER TABLE gestores ADD COLUMN IF NOT EXISTS indicado_por_gestor_id UUID REFERENCES gestores(id); CREATE INDEX IF NOT EXISTS idx_gestores_indicado_por ON gestores(indicado_por_gestor_id);`,
  },
  {
    id: '0033_pro_assistente',
    descricao: 'Assistente PRO WhatsApp — tabelas pro_registros e pro_lembretes',
    sql: `CREATE TABLE IF NOT EXISTS pro_registros (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, gestor_id UUID REFERENCES gestores(id) NOT NULL, tipo TEXT NOT NULL CHECK (tipo IN ('cotacao', 'adesao', 'despesa')), descricao TEXT, valor DECIMAL(10,2) DEFAULT 0, data DATE DEFAULT CURRENT_DATE, created_at TIMESTAMPTZ DEFAULT NOW()); CREATE INDEX IF NOT EXISTS idx_pro_registros_gestor ON pro_registros(gestor_id); CREATE INDEX IF NOT EXISTS idx_pro_registros_data ON pro_registros(data); CREATE TABLE IF NOT EXISTS pro_lembretes (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, gestor_id UUID REFERENCES gestores(id) NOT NULL, mensagem TEXT NOT NULL, lembrar_em TIMESTAMPTZ NOT NULL, enviado BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW()); CREATE INDEX IF NOT EXISTS idx_pro_lembretes_gestor ON pro_lembretes(gestor_id); CREATE INDEX IF NOT EXISTS idx_pro_lembretes_envio ON pro_lembretes(lembrar_em, enviado);`,
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

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createServiceRoleClient()
  const { data: sa } = await (admin.from('super_admins') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!sa) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()
  const migration = MIGRATIONS.find(m => m.id === id)
  if (!migration) return NextResponse.json({ error: 'Migration não encontrada' }, { status: 404 })

  try {
    // Executa cada statement separado por ;
    const statements = migration.sql.split(';').map(s => s.trim()).filter(Boolean)
    for (const sql of statements) {
      const { error } = await admin.rpc('exec_sql', { sql }).catch(() => ({ error: null }))
      // Se rpc não existe, tenta via REST direto
      if (error) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ sql }),
          }
        )
        if (!res.ok) {
          const err = await res.text()
          return NextResponse.json({ error: err }, { status: 500 })
        }
      }
    }
    return NextResponse.json({ ok: true, id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
