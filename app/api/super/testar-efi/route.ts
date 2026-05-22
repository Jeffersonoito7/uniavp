import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { consultarWebhook } from '@/lib/efi'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any)
    .select('tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const variaveis = {
    EFI_CLIENT_ID: process.env.EFI_CLIENT_ID
      ? `${process.env.EFI_CLIENT_ID.substring(0, 20)}...` : '❌ NÃO CONFIGURADO',
    EFI_CLIENT_SECRET: process.env.EFI_CLIENT_SECRET
      ? '✅ configurado' : '❌ NÃO CONFIGURADO',
    EFI_PIX_KEY: process.env.EFI_PIX_KEY || '❌ NÃO CONFIGURADO',
    EFI_CERT_BASE64: process.env.EFI_CERT_BASE64
      ? `✅ ${process.env.EFI_CERT_BASE64.length} chars` : '❌ NÃO CONFIGURADO',
    EFI_CERT_PASSWORD: process.env.EFI_CERT_PASSWORD !== undefined
      ? '✅ configurado (pode ser vazio)' : '❌ NÃO CONFIGURADO',
    EFI_SANDBOX: process.env.EFI_SANDBOX === 'true' ? 'true (SANDBOX)' : 'false (PRODUÇÃO)',
  }

  let conexao: string
  let webhook: unknown
  let erroConexao: string | undefined

  try {
    webhook = await consultarWebhook()
    conexao = '✅ OK — autenticação Efí funcionando'
  } catch (e: any) {
    conexao = '❌ FALHOU'
    erroConexao = e.message
  }

  // Conta pagamentos pendentes no banco para cruzar com o que chegou na Efí
  const { count: pendentes } = await (adminClient.from('gestor_pagamentos') as any)
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pendente')

  const { count: cobrancasPendentes } = await (adminClient.from('cobrancas') as any)
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pendente')

  return NextResponse.json({
    variaveis,
    conexao,
    ...(erroConexao ? { erroConexao } : {}),
    ...(webhook ? { webhook } : {}),
    banco: {
      gestorPagamentosPendentes: pendentes ?? 0,
      cobrancasPendentes: cobrancasPendentes ?? 0,
    },
  })
}
