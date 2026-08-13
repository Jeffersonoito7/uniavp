import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createServiceRoleClient()
  const { data: adminRecord } = await admin.from('admins')
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  const { data: superRecord } = await admin.from('super_admins')
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord && !superRecord) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const formData = await req.formData()
  const arquivo = formData.get('arquivo') as File | null
  if (!arquivo) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })

  const nome = arquivo.name.toLowerCase()
  const buffer = Buffer.from(await arquivo.arrayBuffer())

  try {
    if (nome.endsWith('.docx')) {
      const mammoth = await import('mammoth')
      const result = await mammoth.convertToHtml({ buffer })
      // Limpa tags vazias e envolve em div com estilo de documento para o preview
      const limpo = result.value
        .replace(/<p>\s*<\/p>/g, '')
        .replace(/<p><br\/>\s*<\/p>/g, '')
        .trim()
      const html = `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.7; color: #111; max-width: 700px; margin: 0 auto;">\n${limpo}\n</div>`
      return NextResponse.json({ ok: true, html, tipo: 'docx' })
    }

    if (nome.endsWith('.pdf')) {
      const pdfParse = await import('pdf-parse')
      const pdfFn = (pdfParse as any).default ?? pdfParse
      const data = await pdfFn(buffer)
      // Converte texto plano para HTML simples com paragrafos
      const html = (data.text as string)
        .split(/\n{2,}/)
        .map((p: string) => p.trim())
        .filter((p: string) => Boolean(p))
        .map((p: string) => `<p style="margin-bottom:12px;">${p.replace(/\n/g, '<br/>')}</p>`)
        .join('\n')
      return NextResponse.json({ ok: true, html, tipo: 'pdf' })
    }

    if (nome.endsWith('.txt') || nome.endsWith('.html') || nome.endsWith('.htm')) {
      const texto = buffer.toString('utf-8')
      const html = nome.endsWith('.txt')
        ? texto.split(/\n{2,}/).map(p => `<p style="margin-bottom:12px;">${p.trim().replace(/\n/g, '<br/>')}</p>`).join('\n')
        : texto
      return NextResponse.json({ ok: true, html, tipo: 'txt' })
    }

    return NextResponse.json({ error: 'Formato não suportado. Use DOCX, PDF, TXT ou HTML.' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro ao processar arquivo: ' + (e?.message ?? String(e)) }, { status: 500 })
  }
}
