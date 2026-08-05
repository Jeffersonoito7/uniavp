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
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtCnpj(c: string) {
  const d = (c || '').replace(/\D/g, '')
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  return c
}

function fmtCep(c: string) {
  const d = (c || '').replace(/\D/g, '')
  return d.length === 8 ? d.replace(/(\d{5})(\d{3})/, '$1-$2') : c
}

function cel(label: string, value: string, colspan = false) {
  if (!value) return ''
  return `<div class="cel${colspan ? ' full' : ''}"><div class="cel-l">${label}</div><div class="cel-v">${value}</div></div>`
}

function gerarHtml(xml: string, numero: string, codigoVerificacao: string): string {
  const numero_n     = tag(xml, 'Numero') || numero
  const cod_ver      = tag(xml, 'CodigoVerificacao') || codigoVerificacao
  const data_em      = fmtData(tag(xml, 'DataEmissao'))
  const competencia  = fmtData(tag(xml, 'Competencia'))
  const rps_num      = tag(tag(xml, 'IdentificacaoRps'), 'Numero')
  const rps_serie    = tag(tag(xml, 'IdentificacaoRps'), 'Serie')
  const rps_tipo     = tag(tag(xml, 'IdentificacaoRps'), 'Tipo')
  const natOper      = tag(xml, 'NaturezaOperacao')
  const optante      = tag(xml, 'OptanteSimplesNacional') === '1' ? 'Sim' : 'Não'
  const incCultural  = tag(xml, 'IncentivadorCultural') === '1' ? 'Sim' : 'Não'

  // Prestador
  const prest_nome   = tag(xml, 'RazaoSocial')
  const prest_fantasia = tag(xml, 'NomeFantasia')
  const prest_cnpj   = fmtCnpj(tag(tag(xml, 'Prestador'), 'Cnpj') || tag(xml, 'Cnpj'))
  const prest_im     = tag(xml, 'InscricaoMunicipal')
  const endP         = tag(xml, 'Endereco')
  const prest_logr   = [tag(endP, 'Endereco'), tag(endP, 'Numero'), tag(endP, 'Complemento')].filter(Boolean).join(', ')
  const prest_bairro = tag(endP, 'Bairro')
  const prest_uf     = tag(endP, 'Uf')
  const prest_cep    = fmtCep(tag(endP, 'Cep'))
  const prest_cidade = tag(endP, 'NomeCidade') || 'Petrolina'

  // Tomador
  const tomXml       = tag(xml, 'TomadorServico')
  const tom_nome     = tag(tomXml, 'RazaoSocial')
  const tom_cnpj     = fmtCnpj(tag(tag(tomXml, 'CpfCnpj'), 'Cnpj') || tag(tag(tomXml, 'CpfCnpj'), 'Cpf'))
  const tom_im       = tag(tag(tomXml, 'IdentificacaoTomador'), 'InscricaoMunicipal')
  const tom_email    = tag(tag(tomXml, 'Contato'), 'Email')
  const tom_tel      = tag(tag(tomXml, 'Contato'), 'Telefone')
  const endT         = tag(tomXml, 'Endereco')
  const tom_logr     = tag(endT, 'Endereco')
  const tom_num      = tag(endT, 'Numero')
  const tom_comp     = tag(endT, 'Complemento')
  const tom_bairro   = tag(endT, 'Bairro')
  const tom_uf       = tag(endT, 'Uf')
  const tom_cep      = fmtCep(tag(endT, 'Cep'))
  const tom_end      = (tom_logr && tom_logr !== 'Nao Informado')
    ? [tom_logr, tom_num, tom_comp].filter(s => s && s !== 'S/N').join(', ')
    : ''

  // Servico
  const servXml      = tag(xml, 'Servico')
  const valServXml   = tag(servXml, 'Valores')
  const discriminacao = tag(servXml, 'Discriminacao')
  const item         = tag(servXml, 'ItemListaServico')
  const cnae         = tag(servXml, 'CodigoCnae')
  const aliquota     = tag(valServXml, 'Aliquota')
  const issRetido    = tag(servXml, 'IssRetido') === '1' ? 'Sim' : 'Não'

  // Valores
  const valXml       = tag(xml, 'ValoresNfse')
  const vlrServicos  = fmtMoeda(tag(valServXml, 'ValorServicos') || tag(valXml, 'BaseCalculo'))
  const baseCalc     = fmtMoeda(tag(valXml, 'BaseCalculo'))
  const vlrIss       = fmtMoeda(tag(valXml, 'ValorIss'))
  const vlrPis       = Number(tag(valXml, 'ValorPis') || 0)
  const vlrCofins    = Number(tag(valXml, 'ValorCofins') || 0)
  const vlrIr        = Number(tag(valXml, 'ValorIr') || 0)
  const vlrCsll      = Number(tag(valXml, 'ValorCsll') || 0)
  const vlrInss      = Number(tag(valXml, 'ValorInss') || 0)
  const vlrDesconto  = Number(tag(valServXml, 'ValorDesconto') || 0)
  const vlrLiquido   = fmtMoeda(tag(valXml, 'ValorLiquidoNfse'))

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>NFS-e Nº ${numero_n} — Universidade APV</title>
<style>
  @page {
    size: A4 portrait;
    margin: 0;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 210mm; height: 297mm; background: #fff; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 8pt; color: #111; }

  @media screen {
    body { background: #9ca3af; display: flex; justify-content: center; padding: 20px 0 40px; }
    .page { box-shadow: 0 8px 40px rgba(0,0,0,.35); }
    .toolbar { display: flex !important; }
  }
  @media print {
    body { background: #fff; }
    .toolbar { display: none !important; }
  }

  .toolbar {
    display: none;
    position: fixed; top: 0; left: 0; right: 0; z-index: 99;
    background: #1e293b; padding: 8px 0; justify-content: center; gap: 10px;
  }
  .btn-print {
    padding: 8px 28px; background: #2563eb; color: #fff;
    border: none; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer;
  }

  .page {
    width: 210mm;
    height: 297mm;
    background: #fff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* ── Cabecalho ── */
  .cab {
    background: #1e3a8a;
    color: #fff;
    padding: 8mm 8mm 6mm;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-shrink: 0;
  }
  .cab-esq { display: flex; flex-direction: column; gap: 3px; }
  .cab-logo { font-size: 18pt; font-weight: 900; letter-spacing: 1px; color: #fbbf24; }
  .cab-sub  { font-size: 7pt; opacity: .85; }
  .cab-emp  { font-size: 9pt; font-weight: 700; margin-top: 4px; }
  .cab-info { font-size: 7pt; opacity: .82; }
  .cab-dir  { text-align: right; font-size: 7pt; opacity: .85; line-height: 1.7; }
  .cab-nfe  { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 2px; }
  .cab-num  { font-size: 26pt; font-weight: 900; color: #fbbf24; line-height: 1; }

  /* ── Faixa RPS ── */
  .rps {
    background: #dbeafe;
    border-top: 2px solid #1e3a8a;
    border-bottom: 1px solid #93c5fd;
    padding: 3px 8mm;
    display: flex;
    gap: 16px;
    flex-shrink: 0;
    flex-wrap: wrap;
  }
  .rps span { font-size: 7pt; color: #1e3a8a; }
  .rps strong { font-weight: 700; }

  /* ── Secoes ── */
  .sec { flex-shrink: 0; }
  .sec-titulo {
    background: #1e3a8a;
    color: #fff;
    font-size: 7pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .6px;
    padding: 3px 8mm;
  }
  .sec-corpo { padding: 5px 8mm; }

  /* Grid de campos */
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 14px; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3px 10px; }
  .grid4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 3px 10px; }
  .cel { display: flex; flex-direction: column; }
  .cel.full { grid-column: 1 / -1; }
  .cel-l { font-size: 6.5pt; text-transform: uppercase; color: #6b7280; font-weight: 700; letter-spacing: .3px; }
  .cel-v { font-size: 8.5pt; color: #111; font-weight: 500; }

  /* Discriminacao */
  .disc {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 2px;
    padding: 5px 8px;
    font-size: 8pt;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;
    min-height: 18mm;
    color: #111;
  }

  /* Tabela valores */
  .tbl { width: 100%; border-collapse: collapse; }
  .tbl th {
    background: #eff6ff;
    font-size: 7pt; font-weight: 700;
    text-align: left; padding: 3px 8px;
    border-bottom: 1px solid #bfdbfe;
    text-transform: uppercase; letter-spacing: .3px;
  }
  .tbl th.num { text-align: right; }
  .tbl td { font-size: 8pt; padding: 4px 8px; border-bottom: 1px solid #f3f4f6; }
  .tbl td.num { text-align: right; font-family: monospace; }
  .tbl tr.total td {
    font-weight: 700; font-size: 10pt;
    background: #dbeafe;
    border-top: 2px solid #1e3a8a;
    border-bottom: none;
  }
  .tbl tr.total td.num { color: #1e3a8a; }

  /* Divisor */
  .div { border-top: 1px solid #e5e7eb; margin: 0 8mm; }

  /* Rodape */
  .rodape {
    margin-top: auto;
    background: #f1f5f9;
    border-top: 2px solid #1e3a8a;
    padding: 4mm 8mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }
  .auth-l { font-size: 6.5pt; color: #6b7280; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; }
  .auth-cod { font-family: monospace; font-size: 13pt; font-weight: 700; color: #1e3a8a; letter-spacing: 2px; }
  .rodape-r { font-size: 6.5pt; color: #9ca3af; text-align: right; line-height: 1.6; }
  .rodape-r strong { color: #374151; }
</style>
</head>
<body>

<div class="toolbar">
  <button class="btn-print" onclick="window.print()">Imprimir / Salvar PDF (A4)</button>
</div>

<div class="page">

  <!-- CABECALHO -->
  <div class="cab">
    <div class="cab-esq">
      <div class="cab-logo">UNIVERSIDADE APV</div>
      <div class="cab-sub">Nota Fiscal de Serviços Eletrônica — ABRASF 2.04 — Sistema e&amp;L</div>
      <div class="cab-emp">${esc(prest_nome)}</div>
      ${prest_fantasia ? `<div class="cab-info">Nome Fantasia: ${esc(prest_fantasia)}</div>` : ''}
      <div class="cab-info">CNPJ: ${esc(prest_cnpj)} &nbsp;|&nbsp; I.M.: ${esc(prest_im)}</div>
      <div class="cab-info">${esc(prest_logr)}${prest_bairro ? ', ' + prest_bairro : ''} &nbsp;|&nbsp; ${esc(prest_cidade)}/${esc(prest_uf)} &nbsp; CEP ${esc(prest_cep)}</div>
    </div>
    <div class="cab-dir">
      <div class="cab-nfe">NFS-e</div>
      <div class="cab-num">${esc(numero_n)}</div>
      <div style="margin-top:4px;">Emissão: ${esc(data_em)}</div>
      <div>Competência: ${esc(competencia)}</div>
      <div style="margin-top:4px;font-size:7pt;font-weight:700;color:#fbbf24;">PREFEITURA DE PETROLINA-PE</div>
    </div>
  </div>

  <!-- FAIXA RPS -->
  <div class="rps">
    <span><strong>RPS:</strong> ${esc(rps_num)}</span>
    <span><strong>Série:</strong> ${esc(rps_serie)}</span>
    ${rps_tipo ? `<span><strong>Tipo:</strong> ${esc(rps_tipo)}</span>` : ''}
    <span><strong>Nat. Operação:</strong> ${esc(natOper) || '—'}</span>
    <span><strong>Simples Nacional:</strong> ${esc(optante)}</span>
    <span><strong>Incentivador Cultural:</strong> ${esc(incCultural)}</span>
  </div>

  <!-- TOMADOR -->
  <div class="sec">
    <div class="sec-titulo">Tomador de Serviços</div>
    <div class="sec-corpo">
      <div class="grid">
        ${cel('Razão Social / Nome', esc(tom_nome))}
        ${cel('CNPJ / CPF', esc(tom_cnpj))}
        ${tom_im ? cel('Inscrição Municipal', esc(tom_im)) : ''}
        ${tom_email ? cel('E-mail', esc(tom_email)) : ''}
        ${tom_tel ? cel('Telefone', esc(tom_tel)) : ''}
        ${tom_end ? cel('Endereço', esc(tom_end)) : ''}
        ${tom_bairro ? cel('Bairro', esc(tom_bairro)) : ''}
        ${(tom_uf || tom_cep) ? cel('UF / CEP', [tom_uf, tom_cep].filter(Boolean).join(' — ')) : ''}
      </div>
    </div>
  </div>

  <div class="div"></div>

  <!-- DISCRIMINACAO -->
  <div class="sec">
    <div class="sec-titulo">Discriminação do Serviço</div>
    <div class="sec-corpo">
      <div class="disc">${esc(discriminacao)}</div>
    </div>
  </div>

  <div class="div"></div>

  <!-- DADOS DO SERVICO -->
  <div class="sec">
    <div class="sec-titulo">Dados do Serviço</div>
    <div class="sec-corpo">
      <div class="grid4">
        ${cel('Item LC 116', esc(item))}
        ${cel('CNAE', esc(cnae) || '—')}
        ${cel('Alíquota ISS', esc(aliquota) + '%')}
        ${cel('ISS Retido', esc(issRetido))}
      </div>
    </div>
  </div>

  <div class="div"></div>

  <!-- VALORES -->
  <div class="sec">
    <div class="sec-titulo">Valores</div>
    <div class="sec-corpo" style="padding-left:0;padding-right:0;">
      <table class="tbl">
        <thead>
          <tr><th>Descrição</th><th class="num">Valor (R$)</th></tr>
        </thead>
        <tbody>
          <tr><td>Valor dos Serviços</td><td class="num">${esc(vlrServicos)}</td></tr>
          ${vlrDesconto > 0 ? `<tr><td>(-) Desconto</td><td class="num">${fmtMoeda(vlrDesconto)}</td></tr>` : ''}
          <tr><td>Base de Cálculo</td><td class="num">${esc(baseCalc)}</td></tr>
          <tr><td>ISS</td><td class="num">${esc(vlrIss)}</td></tr>
          ${vlrPis > 0 ? `<tr><td>PIS</td><td class="num">${fmtMoeda(vlrPis)}</td></tr>` : ''}
          ${vlrCofins > 0 ? `<tr><td>COFINS</td><td class="num">${fmtMoeda(vlrCofins)}</td></tr>` : ''}
          ${vlrIr > 0 ? `<tr><td>IR</td><td class="num">${fmtMoeda(vlrIr)}</td></tr>` : ''}
          ${vlrCsll > 0 ? `<tr><td>CSLL</td><td class="num">${fmtMoeda(vlrCsll)}</td></tr>` : ''}
          ${vlrInss > 0 ? `<tr><td>INSS</td><td class="num">${fmtMoeda(vlrInss)}</td></tr>` : ''}
        </tbody>
        <tfoot>
          <tr class="total"><td>Valor Líquido da Nota</td><td class="num">${esc(vlrLiquido)}</td></tr>
        </tfoot>
      </table>
    </div>
  </div>

  <!-- RODAPE -->
  <div class="rodape">
    <div>
      <div class="auth-l">Código de Autenticação</div>
      <div class="auth-cod">${esc(cod_ver)}</div>
    </div>
    <div class="rodape-r">
      Autentique em: <strong>pe-petrolina-pm-nfs.cloud.el.com.br</strong><br>
      Documento com validade jurídica — Lei Complementar nº 116/2003<br>
      NFS-e Nº ${esc(numero_n)} — Emitida em ${esc(data_em)}
    </div>
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
  if (!nota.xml) return new NextResponse('XML da nota não disponível.', { status: 404 })

  const html = gerarHtml(nota.xml, nota.numero, nota.codigo_verificacao)
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
