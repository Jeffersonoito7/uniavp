import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import QRCode from 'qrcode'

export const dynamic = 'force-dynamic'

function crc16(str: string): string {
  let crc = 0xFFFF
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function tlv(id: string, value: string): string {
  return id + String(value.length).padStart(2, '0') + value
}

function pixPayload(chave: string, nome: string, cidade: string, valor: number, txid: string): string {
  const nomeLimpo = nome.normalize('NFD').replace(/[̀-ͯ]/g, '').substring(0, 25).toUpperCase()
  const cidadeLimpa = cidade.normalize('NFD').replace(/[̀-ͯ]/g, '').substring(0, 15).toUpperCase()
  const txidLimpo = (txid || '***').replace(/\W/g, '').substring(0, 25) || '***'
  const merchantAccount = tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', chave)
  const additionalData = tlv('05', txidLimpo)
  let payload =
    tlv('00', '01') + tlv('01', '12') +
    tlv('26', merchantAccount) +
    '52040000' + '5303986' +
    (valor > 0 ? tlv('54', valor.toFixed(2)) : '') +
    '5802BR' +
    tlv('59', nomeLimpo) + tlv('60', cidadeLimpa) +
    tlv('62', additionalData) + '6304'
  return payload + crc16(payload)
}

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

function row(label: string, value: string) {
  if (!value) return ''
  return `<tr><td class="td-label">${label}</td><td class="td-value">${value}</td></tr>`
}

function gerarHtml(
  xml: string, numero: string, codigoVerificacao: string,
  qrDataUrl?: string, valorPix?: number,
  pixChave?: string, pixNome?: string, pixCidade?: string, obsNota?: string
): string {
  const numero_n    = tag(xml, 'Numero') || numero
  const cod_ver     = tag(xml, 'CodigoVerificacao') || codigoVerificacao
  const data_em     = fmtData(tag(xml, 'DataEmissao'))
  const competencia = fmtData(tag(xml, 'Competencia'))
  const rps_num     = tag(tag(xml, 'IdentificacaoRps'), 'Numero')
  const rps_serie   = tag(tag(xml, 'IdentificacaoRps'), 'Serie')
  const rps_tipo    = tag(tag(xml, 'IdentificacaoRps'), 'Tipo')

  // Prestador
  const prest_nome  = tag(xml, 'RazaoSocial')
  const prest_fantasia = tag(xml, 'NomeFantasia')
  const prest_cnpj  = fmtCnpj(tag(tag(xml, 'Prestador'), 'Cnpj') || tag(xml, 'Cnpj'))
  const prest_im    = tag(xml, 'InscricaoMunicipal')
  const endP        = tag(xml, 'Endereco')
  const prest_logr  = [tag(endP, 'Endereco'), tag(endP, 'Numero'), tag(endP, 'Complemento')].filter(Boolean).join(', ')
  const prest_bairro = tag(endP, 'Bairro')
  const prest_cidade = tag(endP, 'NomeCidade') || 'Petrolina'
  const prest_uf    = tag(endP, 'Uf')
  const prest_cep   = fmtCep(tag(endP, 'Cep'))

  // Tomador
  const tomXml      = tag(xml, 'TomadorServico')
  const tom_nome    = tag(tomXml, 'RazaoSocial')
  const tom_cnpj    = fmtCnpj(tag(tag(tomXml, 'CpfCnpj'), 'Cnpj') || tag(tag(tomXml, 'CpfCnpj'), 'Cpf'))
  const tom_im      = tag(tag(tomXml, 'IdentificacaoTomador'), 'InscricaoMunicipal')
  const tom_email   = tag(tag(tomXml, 'Contato'), 'Email')
  const tom_tel     = tag(tag(tomXml, 'Contato'), 'Telefone')
  const endT        = tag(tomXml, 'Endereco')
  const tom_logr    = tag(endT, 'Endereco')
  const tom_num     = tag(endT, 'Numero')
  const tom_comp    = tag(endT, 'Complemento')
  const tom_bairro  = tag(endT, 'Bairro')
  const tom_uf      = tag(endT, 'Uf')
  const tom_cep     = fmtCep(tag(endT, 'Cep'))
  const tom_end     = (tom_logr && tom_logr !== 'Nao Informado')
    ? [tom_logr, tom_num, tom_comp].filter(s => s && s !== 'S/N').join(', ')
    : ''

  // Servico
  const servXml     = tag(xml, 'Servico')
  const valServXml  = tag(servXml, 'Valores')
  const discriminacao = tag(servXml, 'Discriminacao')
  const item        = tag(servXml, 'ItemListaServico')
  const cnae        = tag(servXml, 'CodigoCnae')
  const aliquota    = tag(valServXml, 'Aliquota')
  const issRetido   = tag(servXml, 'IssRetido') === '1' ? 'Sim' : 'Não'
  const natOper     = tag(xml, 'NaturezaOperacao')
  const optante     = tag(xml, 'OptanteSimplesNacional') === '1' ? 'Sim' : 'Não'
  const incCultural = tag(xml, 'IncentivadorCultural') === '1' ? 'Sim' : 'Não'

  // Valores
  const valXml      = tag(xml, 'ValoresNfse')
  const vlrServicos = fmtMoeda(tag(valServXml, 'ValorServicos') || tag(valXml, 'BaseCalculo'))
  const vlrDesconto = fmtMoeda(tag(valServXml, 'ValorDesconto'))
  const vlrDeducoes = fmtMoeda(tag(valServXml, 'ValorDeducoes'))
  const baseCalc    = fmtMoeda(tag(valXml, 'BaseCalculo'))
  const vlrIss      = fmtMoeda(tag(valXml, 'ValorIss'))
  const vlrPis      = fmtMoeda(tag(valXml, 'ValorPis'))
  const vlrCofins   = fmtMoeda(tag(valXml, 'ValorCofins'))
  const vlrIr       = fmtMoeda(tag(valXml, 'ValorIr'))
  const vlrCsll     = fmtMoeda(tag(valXml, 'ValorCsll'))
  const vlrInss     = fmtMoeda(tag(valXml, 'ValorInss'))
  const vlrLiquido  = fmtMoeda(tag(valXml, 'ValorLiquidoNfse'))

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>NFS-e Nº ${numero_n}</title>
<style>
  @page { size: A4 portrait; margin: 12mm 14mm 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 8.5px; color: #111; background: #d0d0d0; }

  @media print { .toolbar { display: none !important; } body { background: #fff; } }
  .toolbar { background: #1a1a2e; padding: 8px 20px; display: flex; gap: 10px; justify-content: center; align-items: center; position: sticky; top: 0; z-index: 99; }
  .btn-print { padding: 8px 24px; background: #1d4ed8; color: #fff; border: none; border-radius: 5px; font-size: 13px; font-weight: 700; cursor: pointer; }

  .page { width: 210mm; background: #fff; margin: 0 auto; padding: 0; }
  @media screen { .page { box-shadow: 0 4px 24px rgba(0,0,0,.25); margin: 0 auto 30px; } }

  /* Cabecalho da nota */
  .header { border: 1px solid #333; margin-bottom: 0; }
  .header-top { display: flex; border-bottom: 1px solid #333; }
  .header-prest { flex: 1; padding: 6px 8px; border-right: 1px solid #333; }
  .header-prest .empresa { font-size: 11px; font-weight: 700; margin-bottom: 2px; }
  .header-prest .sub { font-size: 7.5px; color: #333; line-height: 1.6; }
  .header-nfse { width: 52mm; padding: 6px 8px; text-align: center; }
  .header-nfse .titulo { font-size: 9px; font-weight: 700; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: .5px; }
  .header-nfse .numero { font-size: 22px; font-weight: 900; color: #1d4ed8; letter-spacing: 1px; }
  .header-nfse .data { font-size: 7.5px; color: #555; margin-top: 2px; }

  /* Secoes */
  .sec { border: 1px solid #333; border-top: none; }
  .sec-head { background: #1d4ed8; color: #fff; font-size: 7.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; padding: 3px 6px; }
  .sec-body { padding: 5px 6px; }

  table.dados { width: 100%; border-collapse: collapse; }
  table.dados td { padding: 2px 4px; vertical-align: top; }
  .td-label { width: 110px; font-size: 7px; text-transform: uppercase; color: #555; font-weight: 700; white-space: nowrap; }
  .td-value { font-size: 8.5px; color: #111; }

  /* Grid de 2 colunas para dados lado a lado */
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0 8px; }

  /* Discriminacao */
  .disc { font-size: 8.5px; white-space: pre-wrap; word-break: break-word; line-height: 1.5; color: #111; padding: 4px 6px; }

  /* Tabela de valores */
  table.valores { width: 100%; border-collapse: collapse; }
  table.valores th { background: #e8edf7; font-size: 7.5px; font-weight: 700; text-align: left; padding: 3px 6px; border-bottom: 1px solid #ccc; }
  table.valores td { font-size: 8.5px; padding: 3px 6px; border-bottom: 1px solid #eee; }
  table.valores td.num { text-align: right; font-family: monospace; }
  table.valores tr.total td { font-weight: 700; font-size: 9.5px; background: #f0f4ff; border-top: 1px solid #333; }

  /* Obs */
  .obs { font-size: 8px; color: #555; font-style: italic; padding: 4px 6px; }

  /* Rodape PIX */
  .rodape-pix { border: 2px solid #16a34a; margin-top: 0; display: flex; align-items: stretch; }
  .pix-esq { padding: 8px 10px; flex: 1; border-right: 1px solid #16a34a; }
  .pix-esq .pix-titulo { font-size: 8px; font-weight: 700; text-transform: uppercase; color: #15803d; letter-spacing: .5px; margin-bottom: 6px; }
  .pix-linha { display: flex; margin-bottom: 4px; }
  .pix-l { font-size: 7px; text-transform: uppercase; color: #555; font-weight: 700; width: 70px; flex-shrink: 0; }
  .pix-v { font-size: 8.5px; color: #111; }
  .pix-v.chave { font-family: monospace; font-weight: 700; font-size: 9px; }
  .pix-v.valor { font-size: 13px; font-weight: 900; color: #15803d; }
  .pix-inst { font-size: 7px; color: #888; margin-top: 6px; line-height: 1.5; }
  .pix-dir { padding: 8px 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 44mm; }
  .pix-dir img { border: 2px solid #16a34a; border-radius: 4px; padding: 2px; }
  .pix-dir span { font-size: 7px; color: #555; margin-top: 4px; text-align: center; }

  /* Autenticacao */
  .auth { border: 1px solid #333; border-top: none; background: #f8f8f8; padding: 4px 8px; display: flex; justify-content: space-between; align-items: center; }
  .auth-l { font-size: 7px; color: #555; }
  .auth-cod { font-family: monospace; font-size: 10px; font-weight: 700; color: #1d4ed8; letter-spacing: 2px; }
  .auth-r { font-size: 7px; color: #888; text-align: right; }
</style>
</head>
<body>

<div class="toolbar">
  <button class="btn-print" onclick="window.print()">Imprimir / Salvar PDF</button>
</div>

<div class="page">

  <!-- CABECALHO -->
  <div class="header">
    <div class="header-top">
      <div class="header-prest">
        <div class="empresa">${esc(prest_nome)}</div>
        ${prest_fantasia ? `<div class="sub">Nome Fantasia: ${esc(prest_fantasia)}</div>` : ''}
        <div class="sub">CNPJ: ${esc(prest_cnpj)} &nbsp;|&nbsp; Inscrição Municipal: ${esc(prest_im)}</div>
        <div class="sub">${esc(prest_logr)}${prest_logr && prest_bairro ? ' — ' : ''}${esc(prest_bairro)}</div>
        <div class="sub">${esc(prest_cidade)}${prest_uf ? '/' + prest_uf : ''}${prest_cep ? ' &nbsp; CEP ' + prest_cep : ''}</div>
        <div class="sub" style="margin-top:3px;color:#1d4ed8;font-weight:700;">PREFEITURA DE PETROLINA-PE &nbsp;|&nbsp; Sistema e&L</div>
      </div>
      <div class="header-nfse">
        <div class="titulo">Nota Fiscal de Serviços Eletrônica</div>
        <div class="numero">${esc(numero_n)}</div>
        <div class="data">Data de Emissão: ${esc(data_em)}</div>
        <div class="data">Competência: ${esc(competencia)}</div>
      </div>
    </div>
    <!-- RPS -->
    <div style="padding:4px 8px; background:#f8f8f8; border-top:1px solid #ccc; display:flex; gap:20px;">
      <span style="font-size:7.5px;"><strong>RPS Nº:</strong> ${esc(rps_num)}</span>
      <span style="font-size:7.5px;"><strong>Série:</strong> ${esc(rps_serie)}</span>
      ${rps_tipo ? `<span style="font-size:7.5px;"><strong>Tipo:</strong> ${esc(rps_tipo)}</span>` : ''}
      <span style="font-size:7.5px;"><strong>Natureza da Operação:</strong> ${esc(natOper)}</span>
      <span style="font-size:7.5px;"><strong>Simples Nacional:</strong> ${esc(optante)}</span>
      <span style="font-size:7.5px;"><strong>Incentivador Cultural:</strong> ${esc(incCultural)}</span>
    </div>
  </div>

  <!-- TOMADOR -->
  <div class="sec">
    <div class="sec-head">Dados do Tomador de Serviços</div>
    <div class="sec-body">
      <div class="grid2">
        <table class="dados">
          ${row('Razão Social / Nome', esc(tom_nome))}
          ${row('CNPJ / CPF', esc(tom_cnpj))}
          ${tom_im ? row('Insc. Municipal', esc(tom_im)) : ''}
        </table>
        <table class="dados">
          ${tom_end ? row('Logradouro', esc(tom_end)) : ''}
          ${tom_bairro ? row('Bairro', esc(tom_bairro)) : ''}
          ${(tom_uf || tom_cep) ? row('UF / CEP', [tom_uf, tom_cep].filter(Boolean).join(' — ')) : ''}
          ${tom_email ? row('E-mail', esc(tom_email)) : ''}
          ${tom_tel ? row('Telefone', esc(tom_tel)) : ''}
        </table>
      </div>
    </div>
  </div>

  <!-- SERVICO -->
  <div class="sec">
    <div class="sec-head">Discriminação do Serviço</div>
    <div class="disc">${esc(discriminacao)}</div>
  </div>

  <!-- DADOS DO SERVICO -->
  <div class="sec">
    <div class="sec-head">Dados do Serviço</div>
    <div class="sec-body">
      <table class="dados" style="width:100%;">
        <tr>
          <td class="td-label">Item LC 116</td><td class="td-value">${esc(item)}</td>
          <td class="td-label">CNAE</td><td class="td-value">${esc(cnae)}</td>
          <td class="td-label">Alíquota ISS</td><td class="td-value">${esc(aliquota)}%</td>
          <td class="td-label">ISS Retido</td><td class="td-value">${esc(issRetido)}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- VALORES -->
  <div class="sec">
    <div class="sec-head">Valores</div>
    <div class="sec-body" style="padding:0;">
      <table class="valores">
        <tr><th>Descrição</th><th style="text-align:right;">Valor (R$)</th></tr>
        <tr><td>Valor dos Serviços</td><td class="num">${esc(vlrServicos)}</td></tr>
        ${Number(tag(xml, 'ValorDesconto') || tag(tag(xml,'Valores'),'ValorDesconto')) > 0 ? `<tr><td>(-) Desconto</td><td class="num">${esc(vlrDesconto)}</td></tr>` : ''}
        ${Number(tag(xml, 'ValorDeducoes') || tag(tag(xml,'Valores'),'ValorDeducoes')) > 0 ? `<tr><td>(-) Deduções</td><td class="num">${esc(vlrDeducoes)}</td></tr>` : ''}
        <tr><td>Base de Cálculo</td><td class="num">${esc(baseCalc)}</td></tr>
        <tr><td>ISS</td><td class="num">${esc(vlrIss)}</td></tr>
        ${Number(tag(xml,'ValorPis') || tag(tag(xml,'ValoresNfse'),'ValorPis')) > 0 ? `<tr><td>PIS</td><td class="num">${esc(vlrPis)}</td></tr>` : ''}
        ${Number(tag(xml,'ValorCofins') || tag(tag(xml,'ValoresNfse'),'ValorCofins')) > 0 ? `<tr><td>COFINS</td><td class="num">${esc(vlrCofins)}</td></tr>` : ''}
        ${Number(tag(xml,'ValorIr') || tag(tag(xml,'ValoresNfse'),'ValorIr')) > 0 ? `<tr><td>IR</td><td class="num">${esc(vlrIr)}</td></tr>` : ''}
        ${Number(tag(xml,'ValorCsll') || tag(tag(xml,'ValoresNfse'),'ValorCsll')) > 0 ? `<tr><td>CSLL</td><td class="num">${esc(vlrCsll)}</td></tr>` : ''}
        ${Number(tag(xml,'ValorInss') || tag(tag(xml,'ValoresNfse'),'ValorInss')) > 0 ? `<tr><td>INSS</td><td class="num">${esc(vlrInss)}</td></tr>` : ''}
        <tr class="total"><td>Valor Líquido da Nota</td><td class="num">${esc(vlrLiquido)}</td></tr>
      </table>
    </div>
  </div>

  ${obsNota ? `
  <div class="sec">
    <div class="sec-head">Observações</div>
    <div class="obs">${esc(obsNota)}</div>
  </div>` : ''}

  <!-- AUTENTICACAO -->
  <div class="auth">
    <div>
      <div class="auth-l">Código de Verificação</div>
      <div class="auth-cod">${esc(cod_ver)}</div>
    </div>
    <div class="auth-r">
      Autentique em: <strong>pe-petrolina-pm-nfs.cloud.el.com.br</strong><br>
      Documento com validade jurídica — Lei Complementar nº 116/2003
    </div>
  </div>

  <!-- RODAPE PIX -->
  ${qrDataUrl ? `
  <div style="border-top: 3px solid #16a34a; margin-top: 6px;">
    <div style="background:#16a34a; color:#fff; font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; padding:3px 8px;">
      Dados para Pagamento via PIX
    </div>
    <div class="rodape-pix" style="border-top:none;">
      <div class="pix-esq">
        <div class="pix-linha"><span class="pix-l">Favorecido</span><span class="pix-v">${esc(pixNome || 'OITO7DIGITAL LTDA')}</span></div>
        <div class="pix-linha"><span class="pix-l">Chave PIX</span><span class="pix-v chave">${esc(pixChave || '')}</span></div>
        <div class="pix-linha"><span class="pix-l">Valor</span><span class="pix-v valor">${fmtMoeda(valorPix ?? 0)}</span></div>
        <div class="pix-inst">Escaneie o QR Code ao lado com o aplicativo do seu banco ou copie a chave PIX acima.</div>
      </div>
      <div class="pix-dir">
        <img src="${qrDataUrl}" alt="QR Code PIX" width="110" height="110" />
        <span>Escaneie para pagar</span>
      </div>
    </div>
  </div>` : ''}

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

  const { data: cfg } = await (sb as any).from('nfse_config').select('pix_key,pix_nome,pix_cidade,obs_nota').eq('id', 'default').maybeSingle()

  let qrDataUrl: string | undefined
  if (cfg?.pix_key) {
    try {
      const valor = Number(nota.valor ?? 0)
      const payload = pixPayload(cfg.pix_key, cfg.pix_nome || 'OITO7DIGITAL LTDA', cfg.pix_cidade || 'PETROLINA', valor, `NF${nota.numero}`)
      qrDataUrl = await QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 1, width: 200 })
    } catch { /* segue sem PIX */ }
  }

  const html = gerarHtml(nota.xml, nota.numero, nota.codigo_verificacao, qrDataUrl, nota.valor, cfg?.pix_key, cfg?.pix_nome, cfg?.pix_cidade, cfg?.obs_nota)
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
