import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

function esc(s: string) {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function tag(xml: string, t: string): string {
  const m = xml.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`))
  return m ? m[1].trim() : ''
}

function fmtData(d: string) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day || ''}/${m || ''}/${y || ''}`
}

function fmtMoeda(v: string | number) {
  const n = Number(v || 0)
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtCnpj(c: string) {
  const d = c.replace(/\D/g, '')
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  return c
}

function fmtCep(c: string) {
  const d = c.replace(/\D/g, '')
  return d.length === 8 ? d.replace(/(\d{5})(\d{3})/, '$1-$2') : c
}

function gerarHtml(xml: string, numero: string, codigoVerificacao: string): string {
  const inf = xml.includes('<InfNfse') ? xml.match(/<InfNfse[\s\S]*$/)?.[0] ?? xml : xml

  const numero_n = tag(xml, 'Numero') || numero
  const cod_ver = tag(xml, 'CodigoVerificacao') || codigoVerificacao
  const data_emissao = fmtData(tag(xml, 'DataEmissao'))

  // Prestador
  const prest_nome = tag(xml, 'RazaoSocial')
  const prest_cnpj = tag(tag(xml, 'Prestador'), 'Cnpj') || tag(xml, 'Cnpj')
  const prest_im = tag(xml, 'InscricaoMunicipal')
  const endPrest = tag(xml, 'Endereco')
  const prest_end = tag(endPrest, 'Endereco')
  const prest_num = tag(endPrest, 'Numero')
  const prest_bairro = tag(endPrest, 'Bairro')
  const prest_cep = fmtCep(tag(endPrest, 'Cep'))
  const prest_uf = tag(endPrest, 'Uf')

  // Tomador
  const tomXml = tag(xml, 'TomadorServico')
  const tom_nome = tag(tomXml, 'RazaoSocial')
  const tom_cnpj = fmtCnpj(tag(tag(tomXml, 'CpfCnpj'), 'Cnpj') || tag(tag(tomXml, 'CpfCnpj'), 'Cpf'))
  const tomEnd = tag(tomXml, 'Endereco')
  const tom_end = tag(tomEnd, 'Endereco')
  const tom_num = tag(tomEnd, 'Numero')
  const tom_bairro = tag(tomEnd, 'Bairro')
  const tom_cep = fmtCep(tag(tomEnd, 'Cep'))
  const tom_uf = tag(tomEnd, 'Uf')
  const tom_email = tag(tag(tomXml, 'Contato'), 'Email')

  // Servico
  const servXml = tag(xml, 'Servico')
  const discriminacao = tag(servXml, 'Discriminacao')
  const item = tag(servXml, 'ItemListaServico')
  const aliquota = tag(tag(servXml, 'Valores'), 'Aliquota')
  const issRetido = tag(servXml, 'IssRetido') === '1' ? 'Sim' : 'Não'

  // Valores
  const valXml = tag(xml, 'ValoresNfse')
  const baseCalculo = fmtMoeda(tag(valXml, 'BaseCalculo'))
  const valorIss = fmtMoeda(tag(valXml, 'ValorIss'))
  const valorLiquido = fmtMoeda(tag(valXml, 'ValorLiquidoNfse'))
  const valorServicos = fmtMoeda(tag(tag(xml, 'Valores'), 'ValorServicos') || tag(valXml, 'BaseCalculo'))

  const rps_num = tag(tag(xml, 'IdentificacaoRps'), 'Numero')
  const rps_serie = tag(tag(xml, 'IdentificacaoRps'), 'Serie')
  const competencia = fmtData(tag(xml, 'Competencia'))
  const optante = tag(xml, 'OptanteSimplesNacional') === '1' ? 'Sim' : 'Não'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>NFS-e N ${numero_n} — Oito7 Digital</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #111; background: #fff; padding: 12px; }
  .danfse { border: 2px solid #1a56db; max-width: 740px; margin: 0 auto; }
  .header { background: #1a56db; color: #fff; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; }
  .header h1 { font-size: 16px; font-weight: 700; letter-spacing: 1px; }
  .header .sub { font-size: 10px; opacity: 0.85; margin-top: 2px; }
  .numero-bloco { background: #e8f0fe; border-bottom: 2px solid #1a56db; padding: 8px 14px; display: flex; gap: 30px; align-items: center; }
  .numero-bloco .num { font-size: 22px; font-weight: 700; color: #1a56db; }
  .numero-bloco .label { font-size: 9px; text-transform: uppercase; color: #555; }
  .numero-bloco .valor-dest { font-size: 18px; font-weight: 700; color: #111; margin-left: auto; }
  .secao { border-bottom: 1px solid #ccc; padding: 8px 14px; }
  .secao-titulo { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #1a56db; letter-spacing: 0.5px; margin-bottom: 6px; border-bottom: 1px solid #dde8ff; padding-bottom: 3px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px 12px; }
  .campo label { font-size: 8px; text-transform: uppercase; color: #666; display: block; margin-bottom: 1px; }
  .campo span { font-size: 10px; font-weight: 500; }
  .chave-bloco { background: #f5f5f5; border: 1px solid #ddd; padding: 8px 14px; display: flex; gap: 20px; align-items: center; }
  .chave-bloco .chave { font-size: 14px; font-weight: 700; letter-spacing: 2px; color: #333; font-family: monospace; }
  .discriminacao { white-space: pre-wrap; word-break: break-word; background: #f9f9f9; padding: 6px 10px; border: 1px solid #eee; border-radius: 3px; font-size: 10px; }
  .footer { padding: 6px 14px; font-size: 8px; color: #888; text-align: center; }
  .tag-simples { background: #d1fae5; color: #065f46; padding: 1px 6px; border-radius: 99px; font-size: 8px; font-weight: 600; }
  @media print {
    body { padding: 0; }
    .btn-print { display: none !important; }
  }
</style>
</head>
<body>
<div style="text-align:center; margin-bottom:10px; display:flex; gap:8px; justify-content:center;">
  <button class="btn-print" onclick="window.print()" style="padding:8px 20px; background:#1a56db; color:#fff; border:none; border-radius:6px; font-size:12px; cursor:pointer; font-weight:600;">Imprimir / Salvar PDF</button>
  <button class="btn-print" onclick="window.close()" style="padding:8px 16px; background:#f3f4f6; color:#374151; border:1px solid #d1d5db; border-radius:6px; font-size:12px; cursor:pointer;">Fechar</button>
</div>

<div class="danfse">
  <!-- Header -->
  <div class="header">
    <div>
      <div class="sub">NOTA FISCAL DE SERVIÇOS ELETRÔNICA</div>
      <h1>NFS-e</h1>
      <div class="sub">Petrolina - PE &nbsp;|&nbsp; ABRASF 2.04 &nbsp;|&nbsp; Emissor: e&L</div>
    </div>
    <div style="text-align:right;">
      <div class="sub">PREFEITURA MUNICIPAL DE PETROLINA</div>
      <div class="sub">SECRETARIA DE FINANÇAS</div>
    </div>
  </div>

  <!-- Numero e Valor -->
  <div class="numero-bloco">
    <div>
      <div class="label">NFS-e Nº</div>
      <div class="num">${esc(numero_n)}</div>
    </div>
    <div>
      <div class="label">Data de Emissão</div>
      <div style="font-size:13px; font-weight:600;">${esc(data_emissao)}</div>
    </div>
    <div>
      <div class="label">Código de Verificação</div>
      <div style="font-size:11px; font-weight:700; font-family:monospace; color:#333;">${esc(cod_ver)}</div>
    </div>
    <div>
      <div class="label">RPS Nº / Série</div>
      <div style="font-size:11px; font-weight:600;">${esc(rps_num)} / ${esc(rps_serie)}</div>
    </div>
    <div class="valor-dest">
      <div class="label">Valor Líquido</div>
      <div>${esc(valorLiquido)}</div>
    </div>
  </div>

  <!-- Prestador -->
  <div class="secao">
    <div class="secao-titulo">Prestador de Serviços</div>
    <div class="grid2">
      <div class="campo"><label>Razão Social / Nome</label><span>${esc(prest_nome)}</span></div>
      <div class="campo"><label>CNPJ / CPF</label><span>${esc(fmtCnpj(prest_cnpj))}</span></div>
      <div class="campo"><label>Inscrição Municipal</label><span>${esc(prest_im)}</span></div>
      <div class="campo"><label>Endereço</label><span>${esc(prest_end)}${prest_num ? ', ' + prest_num : ''} — ${esc(prest_bairro)} — ${esc(prest_uf)} — CEP ${esc(prest_cep)}</span></div>
    </div>
  </div>

  <!-- Tomador -->
  <div class="secao">
    <div class="secao-titulo">Tomador de Serviços</div>
    <div class="grid2">
      <div class="campo"><label>Razão Social / Nome</label><span>${esc(tom_nome || '—')}</span></div>
      <div class="campo"><label>CNPJ / CPF</label><span>${esc(tom_cnpj || '—')}</span></div>
      ${(tom_end && tom_end !== 'Nao Informado') ? `<div class="campo" style="grid-column:1/-1"><label>Endereço</label><span>${esc(tom_end)}${tom_num && tom_num !== 'S/N' ? ', ' + tom_num : ''} — ${esc(tom_bairro)} — ${esc(tom_uf)} — CEP ${esc(tom_cep)}</span></div>` : ''}
      ${tom_email ? `<div class="campo"><label>E-mail</label><span>${esc(tom_email)}</span></div>` : ''}
    </div>
  </div>

  <!-- Servico -->
  <div class="secao">
    <div class="secao-titulo">Discriminação do Serviço</div>
    <div class="discriminacao">${esc(discriminacao)}</div>
    <div class="grid3" style="margin-top:8px;">
      <div class="campo"><label>Item LC 116</label><span>${esc(item)}</span></div>
      <div class="campo"><label>Competência</label><span>${esc(competencia)}</span></div>
      <div class="campo"><label>ISS Retido</label><span>${esc(issRetido)}</span></div>
    </div>
  </div>

  <!-- Valores -->
  <div class="secao">
    <div class="secao-titulo">Valores</div>
    <div class="grid3">
      <div class="campo"><label>Valor dos Serviços</label><span>${esc(valorServicos)}</span></div>
      <div class="campo"><label>Base de Cálculo</label><span>${esc(baseCalculo)}</span></div>
      <div class="campo"><label>Alíquota ISS</label><span>${esc(aliquota)}%</span></div>
      <div class="campo"><label>Valor do ISS</label><span>${esc(valorIss)}</span></div>
      <div class="campo"><label>Valor Líquido</label><span style="font-weight:700; font-size:12px;">${esc(valorLiquido)}</span></div>
      <div class="campo"><label>Optante Simples</label><span>${esc(optante)} <span class="tag-simples">SN</span></span></div>
    </div>
  </div>

  <!-- Chave de autenticacao -->
  <div class="chave-bloco">
    <div>
      <div class="label" style="margin-bottom:3px;">Código de Autenticação</div>
      <div class="chave">${esc(cod_ver)}</div>
    </div>
    <div style="font-size:9px; color:#666; max-width:300px;">
      Verifique a autenticidade desta NFS-e em: <strong>pe-petrolina-pm-nfs.cloud.el.com.br</strong><br>
      Informe o código de verificação acima.
    </div>
  </div>

  <div class="footer">
    Nota Fiscal de Serviços Eletrônica gerada em conformidade com a Lei Complementar nº 116/2003 e legislação municipal de Petrolina-PE.<br>
    Este documento tem validade jurídica mediante autenticação no portal da Prefeitura.
  </div>
</div>
</body>
</html>`
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Não autenticado', { status: 401 })

  const sb = createServiceRoleClient()
  const { data: admin } = await sb.from('super_admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!admin) return new NextResponse('Sem permissão', { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return new NextResponse('id obrigatório', { status: 400 })

  const { data: nota } = await (sb as any).from('nfse_notas').select('*').eq('id', id).maybeSingle()
  if (!nota) return new NextResponse('Nota não encontrada', { status: 404 })

  if (!nota.xml) {
    return new NextResponse('XML da nota não disponível (nota emitida antes desta versão).', { status: 404 })
  }

  const html = gerarHtml(nota.xml, nota.numero, nota.codigo_verificacao)
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}
