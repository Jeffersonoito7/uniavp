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

function campo(label: string, valor: string, extra = '') {
  if (!valor) return ''
  return `<div class="campo" ${extra}><span class="campo-label">${label}</span><span class="campo-valor">${valor}</span></div>`
}

function gerarHtml(
  xml: string, numero: string, codigoVerificacao: string,
  qrDataUrl?: string, qrPayload?: string, valorPix?: number,
  pixChave?: string, pixNome?: string, obsNota?: string
): string {
  const numero_n   = tag(xml, 'Numero') || numero
  const cod_ver    = tag(xml, 'CodigoVerificacao') || codigoVerificacao
  const data_em    = fmtData(tag(xml, 'DataEmissao'))
  const competencia = fmtData(tag(xml, 'Competencia'))
  const rps_num    = tag(tag(xml, 'IdentificacaoRps'), 'Numero')
  const rps_serie  = tag(tag(xml, 'IdentificacaoRps'), 'Serie')

  // Prestador
  const prest_nome = tag(xml, 'RazaoSocial')
  const prest_cnpj = fmtCnpj(tag(tag(xml, 'Prestador'), 'Cnpj') || tag(xml, 'Cnpj'))
  const prest_im   = tag(xml, 'InscricaoMunicipal')
  const endP       = tag(xml, 'Endereco')
  const prest_end  = [tag(endP, 'Endereco'), tag(endP, 'Numero'), tag(endP, 'Bairro'), tag(endP, 'Uf'), 'CEP ' + fmtCep(tag(endP, 'Cep'))].filter(Boolean).join(', ')

  // Tomador
  const tomXml     = tag(xml, 'TomadorServico')
  const tom_nome   = tag(tomXml, 'RazaoSocial')
  const tom_cnpj   = fmtCnpj(tag(tag(tomXml, 'CpfCnpj'), 'Cnpj') || tag(tag(tomXml, 'CpfCnpj'), 'Cpf'))
  const tom_email  = tag(tag(tomXml, 'Contato'), 'Email')
  const endT       = tag(tomXml, 'Endereco')
  const tom_logr   = tag(endT, 'Endereco')
  const tom_end    = tom_logr && tom_logr !== 'Nao Informado'
    ? [tom_logr, tag(endT, 'Numero'), tag(endT, 'Bairro'), tag(endT, 'Uf'), 'CEP ' + fmtCep(tag(endT, 'Cep'))].filter(s => s && s !== 'S/N').join(', ')
    : ''

  // Servico
  const servXml    = tag(xml, 'Servico')
  const discriminacao = tag(servXml, 'Discriminacao')
  const item       = tag(servXml, 'ItemListaServico')
  const aliquota   = tag(tag(servXml, 'Valores'), 'Aliquota')
  const issRetido  = tag(servXml, 'IssRetido') === '1' ? 'Sim' : 'Não'

  // Valores
  const valXml     = tag(xml, 'ValoresNfse')
  const baseCalc   = fmtMoeda(tag(valXml, 'BaseCalculo'))
  const valorIss   = fmtMoeda(tag(valXml, 'ValorIss'))
  const valorLiq   = fmtMoeda(tag(valXml, 'ValorLiquidoNfse'))
  const valorServ  = fmtMoeda(tag(tag(xml, 'Valores'), 'ValorServicos') || tag(valXml, 'BaseCalculo'))
  const optante    = tag(xml, 'OptanteSimplesNacional') === '1' ? 'Sim' : 'Não'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>NFS-e Nº ${numero_n} — Oito7 Digital</title>
<style>
  @page { size: A4 portrait; margin: 8mm 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9.5px; color: #1a1a2e; background: #e8ecf1; }

  /* ── Toolbar (so na tela) ── */
  .toolbar { background: #0f172a; padding: 10px 20px; display: flex; gap: 10px; align-items: center; justify-content: center; position: sticky; top: 0; z-index: 99; }
  .btn-print { padding: 9px 26px; background: #1d4ed8; color: #fff; border: none; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer; letter-spacing: .3px; }
  .btn-close  { padding: 9px 18px; background: transparent; color: #94a3b8; border: 1px solid #334155; border-radius: 6px; font-size: 12px; cursor: pointer; }
  @media print { .toolbar { display: none !important; } body { background: #fff; } }

  /* ── Pagina A4 ── */
  .page { width: 210mm; min-height: 297mm; background: #fff; margin: 0 auto; display: flex; flex-direction: column; }
  @media screen { .page { box-shadow: 0 6px 32px rgba(0,0,0,.22); margin: 0 auto 30px; } }

  /* ── Cabecalho azul ── */
  .cab { background: #1d4ed8; color: #fff; padding: 10px 14px 10px; display: flex; justify-content: space-between; align-items: flex-start; }
  .cab-esq h1 { font-size: 20px; font-weight: 900; letter-spacing: 2px; }
  .cab-esq p  { font-size: 8.5px; opacity: .82; margin-top: 1px; }
  .cab-dir    { text-align: right; font-size: 8px; opacity: .85; line-height: 1.6; }

  /* ── Faixa de dados da nota ── */
  .faixa { background: #dbeafe; border-top: 1px solid #93c5fd; border-bottom: 2px solid #1d4ed8; padding: 7px 14px; display: flex; gap: 0; }
  .faixa-item { flex: 1; border-right: 1px solid #93c5fd; padding: 0 12px; }
  .faixa-item:first-child { padding-left: 0; }
  .faixa-item:last-child  { border-right: none; }
  .faixa-label { font-size: 7.5px; text-transform: uppercase; color: #1e40af; font-weight: 700; letter-spacing: .4px; }
  .faixa-val   { font-size: 12px; font-weight: 700; color: #1a1a2e; margin-top: 2px; }
  .faixa-val.grande { font-size: 16px; color: #1d4ed8; }

  /* ── Corpo principal: 2 colunas ── */
  .corpo { display: flex; flex: 1; }
  .col-esq { flex: 1; border-right: 2px solid #e2e8f0; padding: 0; }
  .col-dir  { width: 68mm; padding: 0; display: flex; flex-direction: column; }

  /* ── Secoes ── */
  .sec { padding: 7px 12px; border-bottom: 1px solid #e2e8f0; }
  .sec-titulo { font-size: 7.5px; font-weight: 800; text-transform: uppercase; color: #1d4ed8; letter-spacing: .6px; padding-bottom: 4px; border-bottom: 1px solid #dbeafe; margin-bottom: 6px; }
  .campo      { margin-bottom: 4px; }
  .campo-label { display: block; font-size: 7px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: .3px; margin-bottom: 1px; }
  .campo-valor { font-size: 9.5px; font-weight: 500; color: #1a1a2e; }
  .campo-valor.bold { font-weight: 700; font-size: 11px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 14px; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px 10px; }
  .disc { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 3px; padding: 5px 8px; font-size: 9px; white-space: pre-wrap; word-break: break-word; color: #334155; }

  /* ── Coluna PIX ── */
  .pix-bloco { background: #f0fdf4; border-bottom: 1px solid #bbf7d0; padding: 10px 12px; display: flex; flex-direction: column; align-items: center; text-align: center; flex: 1; }
  .pix-titulo { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #15803d; letter-spacing: .5px; margin-bottom: 6px; }
  .pix-valor  { font-size: 20px; font-weight: 900; color: #15803d; margin-bottom: 6px; }
  .pix-qr     { border: 3px solid #22c55e; border-radius: 8px; padding: 4px; background: #fff; margin-bottom: 8px; }
  .pix-label  { font-size: 7.5px; color: #15803d; font-weight: 700; text-transform: uppercase; letter-spacing: .3px; margin-bottom: 2px; }
  .pix-chave  { font-size: 9px; font-family: monospace; color: #166534; font-weight: 700; word-break: break-all; }
  .pix-inst   { font-size: 7.5px; color: #4ade80; margin-top: 6px; line-height: 1.5; }
  .pix-favor  { font-size: 8.5px; font-weight: 700; color: #166534; margin-top: 4px; }

  /* ── Rodape ── */
  .rodape { background: #f8fafc; border-top: 2px solid #1d4ed8; padding: 7px 14px; display: flex; gap: 20px; align-items: center; justify-content: space-between; }
  .auth-label { font-size: 7px; text-transform: uppercase; color: #1d4ed8; font-weight: 700; letter-spacing: .4px; margin-bottom: 2px; }
  .auth-cod   { font-family: monospace; font-size: 12px; font-weight: 700; color: #1a1a2e; letter-spacing: 2px; }
  .rodape-texto { font-size: 7px; color: #94a3b8; text-align: right; line-height: 1.6; max-width: 200px; }

  /* ── Obs ── */
  .obs-bloco { background: #fffbeb; border-top: 1px solid #fde68a; padding: 6px 12px; }
  .obs-titulo { font-size: 7.5px; font-weight: 800; text-transform: uppercase; color: #92400e; letter-spacing: .4px; margin-bottom: 3px; }
  .obs-txt    { font-size: 8.5px; color: #78350f; }
</style>
</head>
<body>
<div class="toolbar">
  <button class="btn-print" onclick="window.print()">Imprimir / Salvar PDF (A4)</button>
  <button class="btn-close"  onclick="window.close()">Fechar</button>
</div>

<div class="page">

  <!-- CABECALHO -->
  <div class="cab">
    <div class="cab-esq">
      <h1>NFS-e</h1>
      <p>Nota Fiscal de Serviços Eletrônica &nbsp;·&nbsp; ABRASF 2.04 &nbsp;·&nbsp; e&amp;L</p>
      <p style="margin-top:4px;font-size:10px;font-weight:700;opacity:1;">${esc(prest_nome)}</p>
      <p style="font-size:8px;opacity:.8;">CNPJ ${esc(prest_cnpj)} &nbsp;·&nbsp; I.M. ${esc(prest_im)}</p>
      <p style="font-size:8px;opacity:.75;">${esc(prest_end)}</p>
    </div>
    <div class="cab-dir">
      <div style="font-size:8px;font-weight:700;opacity:1;margin-bottom:2px;">PREFEITURA MUNICIPAL DE PETROLINA - PE</div>
      <div>Secretaria de Finanças</div>
      <div>Emitido em ${esc(data_em)}</div>
    </div>
  </div>

  <!-- FAIXA DADOS DA NOTA -->
  <div class="faixa">
    <div class="faixa-item">
      <div class="faixa-label">NFS-e Nº</div>
      <div class="faixa-val grande">${esc(numero_n)}</div>
    </div>
    <div class="faixa-item">
      <div class="faixa-label">RPS / Série</div>
      <div class="faixa-val">${esc(rps_num)} / ${esc(rps_serie)}</div>
    </div>
    <div class="faixa-item">
      <div class="faixa-label">Competência</div>
      <div class="faixa-val">${esc(competencia)}</div>
    </div>
    <div class="faixa-item">
      <div class="faixa-label">Item LC 116</div>
      <div class="faixa-val">${esc(item)}</div>
    </div>
    <div class="faixa-item">
      <div class="faixa-label">Valor Líquido</div>
      <div class="faixa-val grande">${esc(valorLiq)}</div>
    </div>
  </div>

  <!-- CORPO -->
  <div class="corpo">

    <!-- COLUNA ESQUERDA -->
    <div class="col-esq">

      <!-- Tomador -->
      <div class="sec">
        <div class="sec-titulo">Tomador de Serviços</div>
        <div class="grid2">
          ${campo('Razão Social / Nome', esc(tom_nome || '—'))}
          ${campo('CNPJ / CPF', esc(tom_cnpj || '—'))}
          ${tom_end ? campo('Endereço', esc(tom_end), 'style="grid-column:1/-1"') : ''}
          ${tom_email ? campo('E-mail', esc(tom_email)) : ''}
        </div>
      </div>

      <!-- Discriminacao -->
      <div class="sec">
        <div class="sec-titulo">Discriminação do Serviço</div>
        <div class="disc">${esc(discriminacao)}</div>
      </div>

      <!-- Valores -->
      <div class="sec">
        <div class="sec-titulo">Valores Fiscais</div>
        <div class="grid3">
          ${campo('Valor dos Serviços', esc(valorServ))}
          ${campo('Base de Cálculo', esc(baseCalc))}
          ${campo('Alíquota ISS', esc(aliquota) + '%')}
          ${campo('Valor do ISS', esc(valorIss))}
          ${campo('ISS Retido', esc(issRetido))}
          ${campo('Simples Nacional', esc(optante))}
        </div>
        <div style="margin-top:8px; padding-top:6px; border-top:1px solid #e2e8f0; display:flex; justify-content:flex-end;">
          <div>${campo('Valor Líquido a Pagar', esc(valorLiq))}</div>
        </div>
      </div>

      ${obsNota ? `
      <div class="obs-bloco">
        <div class="obs-titulo">Observações</div>
        <div class="obs-txt">${esc(obsNota)}</div>
      </div>` : ''}

    </div>

    <!-- COLUNA DIREITA: PIX -->
    <div class="col-dir">
      ${qrDataUrl ? `
      <div class="pix-bloco">
        <div class="pix-titulo">Pagamento via PIX</div>
        <div class="pix-valor">${fmtMoeda(valorPix ?? 0)}</div>
        <img class="pix-qr" src="${qrDataUrl}" alt="QR Code PIX" width="160" height="160" />
        <div class="pix-favor">${esc(pixNome || 'OITO7DIGITAL LTDA')}</div>
        <div style="margin-top:8px;">
          <div class="pix-label">Chave PIX</div>
          <div class="pix-chave">${esc(pixChave || '')}</div>
        </div>
        <div class="pix-inst">Escaneie o QR Code com o app do banco ou copie a chave PIX</div>
      </div>
      ` : `
      <div class="pix-bloco" style="justify-content:center; opacity:.4;">
        <div class="pix-titulo">PIX não configurado</div>
      </div>
      `}

      <!-- Codigo de verificacao -->
      <div class="sec" style="background:#f0f4ff; border-top:1px solid #c7d7fe;">
        <div class="sec-titulo" style="color:#1d4ed8;">Autenticação da Nota</div>
        ${campo('Código de Verificação', esc(cod_ver))}
        <div style="font-size:7.5px;color:#64748b;margin-top:5px;line-height:1.5;">
          Verifique em:<br><strong style="color:#1d4ed8;">pe-petrolina-pm-nfs.cloud.el.com.br</strong>
        </div>
      </div>
    </div>

  </div>

  <!-- RODAPE -->
  <div class="rodape">
    <div>
      <div class="auth-label">Código de Autenticação</div>
      <div class="auth-cod">${esc(cod_ver)}</div>
    </div>
    <div class="rodape-texto">
      Documento com validade jurídica conforme Lei Complementar nº 116/2003.<br>
      Autentique em: pe-petrolina-pm-nfs.cloud.el.com.br
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

  const { data: cfg } = await (sb as any).from('nfse_config').select('pix_key,pix_nome,pix_cidade,obs_nota').eq('id', 'default').maybeSingle()

  let qrDataUrl: string | undefined
  let qrPayload: string | undefined
  if (cfg?.pix_key) {
    try {
      const valor = Number(nota.valor ?? 0)
      qrPayload = pixPayload(cfg.pix_key, cfg.pix_nome || 'OITO7DIGITAL LTDA', cfg.pix_cidade || 'PETROLINA', valor, `NF${nota.numero}`)
      qrDataUrl = await QRCode.toDataURL(qrPayload, { errorCorrectionLevel: 'M', margin: 1, width: 200 })
    } catch { /* segue sem PIX */ }
  }

  const html = gerarHtml(nota.xml, nota.numero, nota.codigo_verificacao, qrDataUrl, qrPayload, nota.valor, cfg?.pix_key, cfg?.pix_nome, cfg?.obs_nota)
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
