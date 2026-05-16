import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const PROJECT_REF = 'chntghqjogoqdhyuargf'

const SQLS = [
  `CREATE TABLE IF NOT EXISTS otp_whatsapp (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, whatsapp TEXT NOT NULL, codigo TEXT NOT NULL, expira_em TIMESTAMPTZ NOT NULL, usado BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE INDEX IF NOT EXISTS idx_otp_whatsapp_wpp ON otp_whatsapp(whatsapp)`,
  `CREATE INDEX IF NOT EXISTS idx_otp_whatsapp_expira ON otp_whatsapp(expira_em)`,
  `ALTER TABLE gestores ADD COLUMN IF NOT EXISTS indicado_por_gestor_id UUID REFERENCES gestores(id)`,
  `CREATE INDEX IF NOT EXISTS idx_gestores_indicado_por ON gestores(indicado_por_gestor_id)`,
  `CREATE TABLE IF NOT EXISTS pro_registros (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, gestor_id UUID REFERENCES gestores(id) NOT NULL, tipo TEXT NOT NULL CHECK (tipo IN ('cotacao', 'adesao', 'despesa')), descricao TEXT, valor DECIMAL(10,2) DEFAULT 0, data DATE DEFAULT CURRENT_DATE, created_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE INDEX IF NOT EXISTS idx_pro_registros_gestor ON pro_registros(gestor_id)`,
  `CREATE INDEX IF NOT EXISTS idx_pro_registros_data ON pro_registros(data)`,
  `CREATE TABLE IF NOT EXISTS pro_lembretes (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, gestor_id UUID REFERENCES gestores(id) NOT NULL, mensagem TEXT NOT NULL, lembrar_em TIMESTAMPTZ NOT NULL, enviado BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE INDEX IF NOT EXISTS idx_pro_lembretes_gestor ON pro_lembretes(gestor_id)`,
  `CREATE INDEX IF NOT EXISTS idx_pro_lembretes_envio ON pro_lembretes(lembrar_em, enviado)`,
]

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }

  const accessToken = process.env.SUPABASE_ACCESS_TOKEN
  if (!accessToken) {
    return NextResponse.json({ error: 'SUPABASE_ACCESS_TOKEN não configurado na Vercel' }, { status: 500 })
  }

  const resultados: { sql: string; ok: boolean; erro?: string }[] = []

  for (const sql of SQLS) {
    try {
      const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      })
      const data = await res.json()
      if (!res.ok) {
        resultados.push({ sql: sql.slice(0, 80), ok: false, erro: data.message || JSON.stringify(data) })
      } else {
        resultados.push({ sql: sql.slice(0, 80), ok: true })
      }
    } catch (e: any) {
      resultados.push({ sql: sql.slice(0, 80), ok: false, erro: e.message })
    }
  }

  const todos = resultados.every(r => r.ok)
  return NextResponse.json({ ok: todos, resultados }, { status: todos ? 200 : 207 })
}
