import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const PROJECT_REF = 'chntghqjogoqdhyuargf'

export async function GET() {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN
  if (!accessToken) {
    return NextResponse.json({ ok: false, msg: 'SUPABASE_ACCESS_TOKEN não configurado' }, { status: 500 })
  }

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: 'ALTER TABLE gestores ADD COLUMN IF NOT EXISTS link_externo TEXT' }),
  })

  if (!res.ok) {
    const data = await res.json()
    return NextResponse.json({ ok: false, erro: data.message ?? JSON.stringify(data) }, { status: 500 })
  }

  return NextResponse.json({ ok: true, msg: 'Coluna link_externo criada com sucesso!' })
}
