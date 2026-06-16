import { NextResponse } from 'next/server'
import { listarPlanosAssinatura } from '@/lib/efi'

export async function GET() {
  try {
    const planos = await listarPlanosAssinatura()
    return NextResponse.json({ planos })
  } catch (e: any) {
    return NextResponse.json({ erro: e.message })
  }
}
