// Motor NFS-e Padrao Nacional (DPS v1.00) para Next.js/Vercel.
// Usa xml-crypto para XMLDSIG e zlib nativo para GZip.
// Substitui o motor ABRASF 2.04 (SOAP), desativado pela Reforma Tributaria (IBS/CBS).
import crypto from 'crypto'
import https from 'https'
import zlib from 'zlib'
import { promisify } from 'util'
import axios from 'axios'
// @ts-ignore
import { SignedXml } from 'xml-crypto'
// @ts-ignore
import forge from 'node-forge'

const gzipAsync = promisify(zlib.gzip)

function getKey(): Buffer {
  const _CHAVE = process.env.NFSE_CERT_KEY || process.env.DATA_ENCRYPTION_KEY
  if (!_CHAVE) throw new Error('NFSE_CERT_KEY ou DATA_ENCRYPTION_KEY ausente no .env')
  return crypto.createHash('sha256').update(_CHAVE).digest()
}

export function encCert(buf: Buffer): string {
  const KEY = getKey()
  const iv = crypto.randomBytes(16)
  const c = crypto.createCipheriv('aes-256-cbc', KEY, iv)
  return Buffer.concat([iv, c.update(buf), c.final()]).toString('base64')
}

export function decCert(b64: string): Buffer {
  const KEY = getKey()
  const buf = Buffer.from(b64, 'base64')
  const iv = buf.slice(0, 16)
  const d = crypto.createDecipheriv('aes-256-cbc', KEY, iv)
  return Buffer.concat([d.update(buf.slice(16)), d.final()])
}

function soDigitos(s: string | number | undefined | null): string {
  return String(s ?? '').replace(/\D/g, '')
}
function esc(s: string | number | undefined | null): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function n2(v: string | number | undefined | null): string {
  return Number(v ?? 0).toFixed(2)
}

export interface CertInfo {
  keyPem: string
  certPem: string
  certBase64: string
  validoAte: Date | null
  titular: string
}

export function carregarCertificado(pfxBuffer: Buffer, senha: string): CertInfo {
  const pfxDer = forge.util.createBuffer(pfxBuffer.toString('binary'))
  const pfxAsn1 = forge.asn1.fromDer(pfxDer)
  const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, false, senha)

  let keyPem = ''
  let certPem = ''
  let certBase64 = ''
  let validoAte: Date | null = null
  let titular = ''

  const keyBagsType = [forge.pki.oids.pkcs8ShroudedKeyBag, forge.pki.oids.keyBag]
  for (const t of keyBagsType) {
    const bags = pfx.getBags({ bagType: t })
    const bag = (bags[t] ?? [])[0]
    if (bag?.key) {
      keyPem = forge.pki.privateKeyToPem(bag.key)
      break
    }
  }

  const certBags = pfx.getBags({ bagType: forge.pki.oids.certBag })
  const certBag = (certBags[forge.pki.oids.certBag] ?? [])[0]
  if (certBag?.cert) {
    certPem = forge.pki.certificateToPem(certBag.cert)
    certBase64 = certPem.replace(/-----BEGIN CERTIFICATE-----/g, '').replace(/-----END CERTIFICATE-----/g, '').replace(/\s+/g, '')
    validoAte = certBag.cert.validity.notAfter
    const cn = certBag.cert.subject.getField('CN')
    titular = cn?.value ?? ''
  }

  if (!keyPem) throw new Error('Chave privada nao encontrada no certificado .pfx')
  if (!certPem) throw new Error('Certificado nao encontrado no arquivo .pfx')

  return { keyPem, certPem, certBase64, validoAte, titular }
}

export function carregarCertificadoDePem(keyPem: string, certPem: string): CertInfo {
  const match = certPem.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/)
  const leafPem = match ? match[0] : certPem
  const cert = forge.pki.certificateFromPem(leafPem)
  const certBase64 = leafPem
    .replace('-----BEGIN CERTIFICATE-----', '')
    .replace('-----END CERTIFICATE-----', '')
    .replace(/\s+/g, '')
  const validoAte = cert.validity.notAfter
  const cn = cert.subject.getField('CN')
  const titular = cn?.value ?? ''
  return { keyPem, certPem: leafPem, certBase64, validoAte, titular }
}

interface NfseConfig {
  urlServico: string
  cnpj: string
  inscricaoMunicipal?: string
  itemListaServico?: string
  aliquotaIss?: string | number
  optanteSimples?: boolean
  incentivadorCultural?: boolean
  codigoMunicipioIbge?: string
  serieRps?: string
  descricaoServico?: string
  codigoTributacaoMunicipio?: string
  codigoServicoPrestado?: string
  codigoServicoNacional?: string
  ambiente?: string
}

interface Tomador {
  cpfCnpj?: string
  cnpj?: string
  cpf?: string
  doc?: string
  nome?: string
  razaoSocial?: string
  inscricaoMunicipal?: string
  im?: string
  email?: string
  endereco?: {
    logradouro?: string
    endereco?: string
    numero?: string
    complemento?: string
    bairro?: string
    codigoCidade?: string
    codigoMunicipio?: string
    estado?: string
    uf?: string
    cep?: string
  }
}

interface DadosEmissao {
  valor: string | number
  descricao?: string
  tomador?: Tomador
  numeroRps?: number
  data?: string
}

// Monta o Id do infDPS no padrao nacional: DPS + IBGE(7) + tipoCNPJ(1) + CNPJ(14) + serie(5) + nDPS(15)
function montarIdDps(ibge: string, cnpj: string, serie: string, nDps: number): string {
  const tipo = cnpj.length === 14 ? '2' : '1'
  const serPad = serie.padStart(5, '0')
  const nPad = String(nDps).padStart(15, '0')
  return `DPS${ibge}${tipo}${cnpj}${serPad}${nPad}`
}

function montarDps(cfg: NfseConfig, dados: DadosEmissao): { xml: string; id: string } {
  const NS = 'http://www.sped.fazenda.gov.br/nfse'
  const cnpjPrest = soDigitos(cfg.cnpj)
  const im = soDigitos(cfg.inscricaoMunicipal)
  const ibge = soDigitos(cfg.codigoMunicipioIbge) || '2611101'
  const aliq = n2(String(cfg.aliquotaIss ?? '0').replace(',', '.'))
  const valor = n2(dados.valor)
  const nDps = dados.numeroRps ?? 1
  const serie = String(cfg.serieRps ?? '1')
  const discr = esc(dados.descricao || cfg.descricaoServico || 'Prestacao de servicos de tecnologia')

  // cTribNac: codigo de tributacao nacional (6 digitos). codigoServicoNacional tem precedencia.
  // Se vier no formato XX.XX (municipal), tenta converter. Fallback para 170601 (Tecnologia).
  let cTribNac = soDigitos(cfg.codigoServicoNacional ?? cfg.codigoTributacaoMunicipio ?? '170601')
  if (cTribNac.length < 6) cTribNac = cTribNac.padStart(6, '0')
  if (cTribNac.length > 6) cTribNac = cTribNac.slice(0, 6)

  // Data/hora no horario de Brasilia (UTC-3)
  const agora = new Date()
  const brasilOffset = -3 * 60
  const brasilMs = agora.getTime() + (brasilOffset - agora.getTimezoneOffset()) * 60000
  const brasilDate = new Date(brasilMs)
  const dataCompet = dados.data || brasilDate.toISOString().slice(0, 10)
  const dhEmi = brasilDate.toISOString().slice(0, 19) + '-03:00'

  const id = montarIdDps(ibge, cnpjPrest, serie, nDps)

  // Tomador
  const t = dados.tomador ?? {}
  const docTom = soDigitos(t.cpfCnpj ?? t.cnpj ?? t.cpf ?? t.doc)
  const nomeTom = esc(t.nome ?? t.razaoSocial ?? '')
  let tomaXml = ''
  if (docTom && nomeTom) {
    const tagDoc = docTom.length === 14 ? `<CNPJ>${docTom}</CNPJ>` : `<CPF>${docTom}</CPF>`
    const e = t.endereco ?? {}
    const cMunTom = soDigitos(e.codigoCidade ?? e.codigoMunicipio ?? ibge)
    const cepTom = soDigitos(e.cep) || '00000000'
    const logr = esc(e.logradouro ?? e.endereco ?? 'Nao Informado')
    const nro = esc(e.numero ?? 'S/N')
    const bairro = esc(e.bairro ?? 'Centro')
    tomaXml =
      `<toma>` +
      tagDoc +
      `<xNome>${nomeTom}</xNome>` +
      `<end>` +
      `<endNac><cMun>${cMunTom}</cMun><CEP>${cepTom}</CEP></endNac>` +
      `<xLgr>${logr}</xLgr>` +
      `<nro>${nro}</nro>` +
      `<xBairro>${bairro}</xBairro>` +
      `</end>` +
      (t.email ? `<fone></fone><email>${esc(t.email)}</email>` : '') +
      `</toma>`
  }

  const optSimp = cfg.optanteSimples ? '1' : '2'

  const infDps =
    `<infDPS Id="${id}">` +
    `<tpAmb>1</tpAmb>` +
    `<dhEmi>${dhEmi}</dhEmi>` +
    `<verAplic>UniAVP_2.0</verAplic>` +
    `<serie>${esc(serie)}</serie>` +
    `<nDPS>${nDps}</nDPS>` +
    `<dCompet>${dataCompet}</dCompet>` +
    `<tpEmit>1</tpEmit>` +
    `<cLocEmi>${ibge}</cLocEmi>` +
    `<prest>` +
    `<CNPJ>${cnpjPrest}</CNPJ>` +
    (im ? `<IM>${im}</IM>` : '') +
    `<regTrib>` +
    `<opSimpNac>${optSimp}</opSimpNac>` +
    `<regEspTrib>0</regEspTrib>` +
    `</regTrib>` +
    `</prest>` +
    tomaXml +
    `<serv>` +
    `<locPrest><cLocPrestacao>${ibge}</cLocPrestacao></locPrest>` +
    `<cServ>` +
    `<cTribNac>${cTribNac}</cTribNac>` +
    `<xDescServ>${discr}</xDescServ>` +
    `</cServ>` +
    `</serv>` +
    `<valores>` +
    `<vServPrest><vServ>${valor}</vServ></vServPrest>` +
    `<trib>` +
    `<tribMun>` +
    `<tribISSQN>1</tribISSQN>` +
    `<tpRetISSQN>2</tpRetISSQN>` +
    `<pAliq>${aliq}</pAliq>` +
    `</tribMun>` +
    `<totTrib>` +
    `<pTotTrib>` +
    `<pTotTribFed>0.00</pTotTribFed>` +
    `<pTotTribEst>0.00</pTotTribEst>` +
    `<pTotTribMun>${aliq}</pTotTribMun>` +
    `</pTotTrib>` +
    `</totTrib>` +
    `</trib>` +
    `</valores>` +
    `</infDPS>`

  const xml = `<?xml version="1.0" encoding="UTF-8"?><DPS versao="1.00" xmlns="${NS}">${infDps}</DPS>`
  return { xml, id }
}

function assinarDps(xml: string, id: string, keyPem: string, certBase64: string): string {
  const sig = new SignedXml()
  sig.signingKey = keyPem
  sig.signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1'
  sig.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
  sig.keyInfoProvider = {
    getKeyInfo: () => `<X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data>`,
    getKey: () => Buffer.from(''),
  }
  sig.addReference(
    `//*[local-name(.)='infDPS']`,
    ['http://www.w3.org/2000/09/xmldsig#enveloped-signature', 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'],
    'http://www.w3.org/2000/09/xmldsig#sha1'
  )
  sig.computeSignature(xml, {
    location: { reference: `//*[local-name(.)='infDPS']`, action: 'after' },
  })
  return sig.getSignedXml()
}

async function enviarDpsRest(
  endpoint: string,
  xmlAssinado: string,
  keyPem: string,
  certPem: string
): Promise<{ status: number; body: string }> {
  const xmlGzip = await gzipAsync(Buffer.from(xmlAssinado, 'utf-8'))
  const dpsXmlGZipB64 = xmlGzip.toString('base64')

  const agent = new https.Agent({ key: keyPem, cert: certPem, rejectUnauthorized: false })
  const resp = await axios.post(
    endpoint,
    { dpsXmlGZipB64 },
    {
      httpsAgent: agent,
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000,
      transformResponse: (x: string) => x,
      validateStatus: () => true,
    }
  )
  return { status: resp.status as number, body: String(resp.data ?? '') }
}

function parseRespostaNacional(json: string): {
  numero: string | null
  chaveAcesso: string | null
  erros: string[]
  xmlNfse: string | null
} {
  let numero: string | null = null
  let chaveAcesso: string | null = null
  const erros: string[] = []
  let xmlNfse: string | null = null

  try {
    const obj = JSON.parse(json)

    // Resposta de sucesso: { nfseXmlGZipB64: "..." }
    if (obj.nfseXmlGZipB64) {
      const buf = Buffer.from(obj.nfseXmlGZipB64, 'base64')
      xmlNfse = zlib.gunzipSync(buf).toString('utf-8')
      const mNum = xmlNfse.match(/<(?:\w+:)?nNFSe>(\d+)</)
      if (mNum) numero = mNum[1]
      const mChave = xmlNfse.match(/<(?:\w+:)?chNFSe>([^<]+)</)
      if (mChave) chaveAcesso = mChave[1]
      return { numero, chaveAcesso, erros, xmlNfse }
    }

    // Resposta de erro: { mensagens: [{codigo, descricao, correcao}] }
    const msgs: any[] = obj.mensagens ?? obj.erros ?? obj.errors ?? []
    for (const m of msgs) {
      const cod = m.codigo ?? m.code ?? ''
      const desc = m.descricao ?? m.mensagem ?? m.message ?? JSON.stringify(m)
      const cor = m.correcao ?? m.correction ?? ''
      erros.push(`${cod ? '[' + cod + '] ' : ''}${desc}${cor ? ' - ' + cor : ''}`)
    }
    if (!erros.length && json) erros.push(json.slice(0, 500))
  } catch {
    erros.push(json.slice(0, 500))
  }

  return { numero, chaveAcesso, erros, xmlNfse }
}

export async function emitirNfse(
  cfg: NfseConfig,
  dados: DadosEmissao,
  certInfo: CertInfo
): Promise<{
  ok: boolean
  numero?: string
  codigoVerificacao?: string | null
  chaveAcesso?: string | null
  xml?: string | null
  httpStatus?: number
  erros?: string[]
  respostaBruta?: string
}> {
  const endpoint = cfg.urlServico
  const { xml, id } = montarDps(cfg, dados)
  const assinado = assinarDps(xml, id, certInfo.keyPem, certInfo.certBase64)
  const { status, body } = await enviarDpsRest(endpoint, assinado, certInfo.keyPem, certInfo.certPem)
  const parsed = parseRespostaNacional(body)

  if (parsed.numero) {
    return {
      ok: true,
      numero: parsed.numero,
      codigoVerificacao: parsed.chaveAcesso,
      chaveAcesso: parsed.chaveAcesso,
      xml: parsed.xmlNfse,
      httpStatus: status,
    }
  }
  return { ok: false, httpStatus: status, erros: parsed.erros, respostaBruta: body.slice(0, 4000) }
}

export async function cancelarNfse(
  cfg: NfseConfig,
  dados: { numero: string; codigoCancelamento?: string; chaveAcesso?: string },
  certInfo: CertInfo
): Promise<{ ok: boolean; erros?: string[]; respostaBruta?: string }> {
  // Cancelamento no padrao nacional: POST /nfse/cancelamento com JSON { pedRegEvento }
  // O endpoint de cancelamento e o mesmo base + /cancelamento
  const endpoint = cfg.urlServico.replace(/\/nfse$/, '/nfse/cancelamento')
  const NS = 'http://www.sped.fazenda.gov.br/nfse'
  const cnpj = soDigitos(cfg.cnpj)
  const ibge = soDigitos(cfg.codigoMunicipioIbge) || '2611101'
  const numero = String(dados.numero)
  const codCanc = String(dados.codigoCancelamento ?? '1')
  const chave = dados.chaveAcesso ?? ''

  const agora = new Date()
  const brasilOffset = -3 * 60
  const brasilMs = agora.getTime() + (brasilOffset - agora.getTimezoneOffset()) * 60000
  const dhEvento = new Date(brasilMs).toISOString().slice(0, 19) + '-03:00'

  const idEvento = `EVT${ibge}2${cnpj}000010000000000000001`

  const infEvento =
    `<infEvento Id="${idEvento}">` +
    `<cOrgaoAutor>99</cOrgaoAutor>` +
    `<tpAmb>1</tpAmb>` +
    `<CNPJ>${cnpj}</CNPJ>` +
    `<chNFSe>${esc(chave)}</chNFSe>` +
    `<dhEvento>${dhEvento}</dhEvento>` +
    `<nSeqEvento>1</nSeqEvento>` +
    `<tpEvento>1</tpEvento>` +
    `<verAplic>UniAVP_2.0</verAplic>` +
    `<detEvento versaoEvento="1.00">` +
    `<descEvento>Cancelamento</descEvento>` +
    `<cMotivo>${esc(codCanc)}</cMotivo>` +
    `<xMotivo>Cancelamento solicitado pelo emitente</xMotivo>` +
    `<nNFSe>${esc(numero)}</nNFSe>` +
    `</detEvento>` +
    `</infEvento>`

  const xmlEvento = `<?xml version="1.0" encoding="UTF-8"?><pedRegEvento versao="1.00" xmlns="${NS}">${infEvento}</pedRegEvento>`

  // Assina o evento
  const sig = new SignedXml()
  sig.signingKey = certInfo.keyPem
  sig.signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1'
  sig.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
  sig.keyInfoProvider = {
    getKeyInfo: () => `<X509Data><X509Certificate>${certInfo.certBase64}</X509Certificate></X509Data>`,
    getKey: () => Buffer.from(''),
  }
  sig.addReference(
    `//*[local-name(.)='infEvento']`,
    ['http://www.w3.org/2000/09/xmldsig#enveloped-signature', 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'],
    'http://www.w3.org/2000/09/xmldsig#sha1'
  )
  sig.computeSignature(xmlEvento, { location: { reference: `//*[local-name(.)='infEvento']`, action: 'after' } })
  const xmlAssinado = sig.getSignedXml()

  const xmlGzip = await gzipAsync(Buffer.from(xmlAssinado, 'utf-8'))
  const payload = { pedRegEventoXmlGZipB64: xmlGzip.toString('base64') }

  const agent = new https.Agent({ key: certInfo.keyPem, cert: certInfo.certPem, rejectUnauthorized: false })
  const resp = await axios.post(endpoint, payload, {
    httpsAgent: agent,
    headers: { 'Content-Type': 'application/json' },
    timeout: 60000,
    transformResponse: (x: string) => x,
    validateStatus: () => true,
  })
  const body = String(resp.data ?? '')

  try {
    const obj = JSON.parse(body)
    if (obj.retRegEvento || resp.status === 200) {
      // Verifica se ha erros no retorno
      const msgs: any[] = obj.mensagens ?? obj.erros ?? []
      if (!msgs.length) return { ok: true }
      const erros = msgs.map((m: any) => {
        const cod = m.codigo ?? ''
        const desc = m.descricao ?? m.mensagem ?? JSON.stringify(m)
        return `${cod ? '[' + cod + '] ' : ''}${desc}`
      })
      // Se nenhuma mensagem for de erro (so informativas), considera ok
      const temErro = erros.some(e => !e.includes('[I')) // codigos I = informativo
      return { ok: !temErro, erros: temErro ? erros : undefined }
    }
  } catch { /* segue para retorno de erro */ }

  return { ok: false, erros: ['Cancelamento recusado pela prefeitura.'], respostaBruta: body.slice(0, 3000) }
}
