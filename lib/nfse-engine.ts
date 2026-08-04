// Motor NFS-e ABRASF 2.04 para Next.js/Vercel.
// Usa node-forge (puro JS) em vez de openssl CLI, que nao esta disponivel no runtime serverless.
import crypto from 'crypto'
import https from 'https'
import axios from 'axios'
// @ts-ignore
import { SignedXml } from 'xml-crypto'
// @ts-ignore
import forge from 'node-forge'

function getKey(): Buffer {
  const _CHAVE = process.env.NFSE_CERT_KEY || process.env.DATA_ENCRYPTION_KEY
  if (!_CHAVE) throw new Error('NFSE_CERT_KEY ou DATA_ENCRYPTION_KEY ausente no .env')
  return crypto.createHash('sha256').update(_CHAVE).digest()
}

const NS = 'http://www.abrasf.org.br/nfse.xsd'
const NS_WS = 'http://nfse.abrasf.org.br'

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
function escXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function unescXml(s: string): string {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')
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

  // Chave privada
  const keyBagsType = [forge.pki.oids.pkcs8ShroudedKeyBag, forge.pki.oids.keyBag]
  for (const t of keyBagsType) {
    const bags = pfx.getBags({ bagType: t })
    const bag = (bags[t] ?? [])[0]
    if (bag?.key) {
      keyPem = forge.pki.privateKeyToPem(bag.key)
      break
    }
  }

  // Certificado
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

// Carrega a partir de PEM já extraído (evita parse do PFX com algoritmos legados)
export function carregarCertificadoDePem(keyPem: string, certPem: string): CertInfo {
  // Extrai apenas o primeiro certificado da cadeia (leaf cert)
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

function montarXml(cfg: NfseConfig, dados: DadosEmissao): { xml: string; id: string } {
  const cnpjPrest = soDigitos(cfg.cnpj)
  const im = soDigitos(cfg.inscricaoMunicipal)
  const ibge = soDigitos(cfg.codigoMunicipioIbge) || '2611101'
  const item = String(cfg.itemListaServico ?? '').trim()
  const aliq = n2(String(cfg.aliquotaIss ?? '0').replace(',', '.'))
  const optante = cfg.optanteSimples ? '1' : '2'
  const incentivo = cfg.incentivadorCultural ? '1' : '2'
  const valor = n2(dados.valor)
  // Data no horario de Brasilia (UTC-3) para evitar data futura no servidor UTC
  const agora = new Date()
  const brasilOffset = -3 * 60
  const brasilMs = agora.getTime() + (brasilOffset - agora.getTimezoneOffset()) * 60000
  const hoje = dados.data || new Date(brasilMs).toISOString().slice(0, 10)
  const rpsNum = String(dados.numeroRps ?? 1)
  const rpsSerie = String(cfg.serieRps ?? '1')
  const discr = esc(dados.descricao || cfg.descricaoServico || 'Prestacao de servicos de tecnologia')

  const t = dados.tomador ?? {}
  const docTom = soDigitos(t.cpfCnpj ?? t.cnpj ?? t.cpf ?? t.doc)
  const nomeTom = t.nome ?? t.razaoSocial ?? ''
  let tomadorXml = ''
  if (docTom && nomeTom) {
    const idTom = docTom.length === 14 ? `<Cnpj>${docTom}</Cnpj>` : `<Cpf>${docTom}</Cpf>`
    const imTom = soDigitos(t.inscricaoMunicipal ?? t.im)
    const e = t.endereco ?? {}
    const logr = e.logradouro ?? e.endereco
    const endTom = logr
      ? `<Endereco>` +
        `<Endereco>${esc(logr)}</Endereco>` +
        `<Numero>${esc(e.numero ?? 'S/N')}</Numero>` +
        (e.complemento ? `<Complemento>${esc(e.complemento)}</Complemento>` : '') +
        `<Bairro>${esc(e.bairro ?? 'Centro')}</Bairro>` +
        `<CodigoMunicipio>${soDigitos(e.codigoCidade ?? e.codigoMunicipio ?? ibge)}</CodigoMunicipio>` +
        `<Uf>${esc(e.estado ?? e.uf ?? 'PE')}</Uf>` +
        `<Cep>${soDigitos(e.cep) || '00000000'}</Cep>` +
        `</Endereco>`
      : ''
    tomadorXml =
      `<TomadorServico>` +
      `<IdentificacaoTomador><CpfCnpj>${idTom}</CpfCnpj>` +
      (imTom ? `<InscricaoMunicipal>${imTom}</InscricaoMunicipal>` : '') +
      `</IdentificacaoTomador>` +
      `<RazaoSocial>${esc(nomeTom)}</RazaoSocial>` +
      endTom +
      (t.email ? `<Contato><Email>${esc(t.email)}</Email></Contato>` : '') +
      `</TomadorServico>`
  }

  const id = `rps${rpsNum}`
  const inf =
    `<InfDeclaracaoPrestacaoServico Id="${id}">` +
    `<Rps>` +
    `<IdentificacaoRps><Numero>${rpsNum}</Numero><Serie>${esc(rpsSerie)}</Serie><Tipo>1</Tipo></IdentificacaoRps>` +
    `<DataEmissao>${hoje}</DataEmissao>` +
    `<Status>1</Status>` +
    `</Rps>` +
    `<Competencia>${hoje}</Competencia>` +
    `<Servico>` +
    `<Valores><ValorServicos>${valor}</ValorServicos><Aliquota>${aliq}</Aliquota></Valores>` +
    `<IssRetido>2</IssRetido>` +
    (cfg.codigoServicoPrestado ? `<CodigoServico>${esc(cfg.codigoServicoPrestado)}</CodigoServico>` : '') +
    `<ItemListaServico>${esc(item)}</ItemListaServico>` +
    (cfg.codigoTributacaoMunicipio ? `<CodigoTributacaoMunicipio>${esc(cfg.codigoTributacaoMunicipio)}</CodigoTributacaoMunicipio>` : '') +
    `<Discriminacao>${discr}</Discriminacao>` +
    `<CodigoMunicipio>${ibge}</CodigoMunicipio>` +
    `<ExigibilidadeISS>1</ExigibilidadeISS>` +
    `</Servico>` +
    `<Prestador><CpfCnpj><Cnpj>${cnpjPrest}</Cnpj></CpfCnpj>` +
    (im ? `<InscricaoMunicipal>${im}</InscricaoMunicipal>` : '') +
    `</Prestador>` +
    tomadorXml +
    `<OptanteSimplesNacional>${optante}</OptanteSimplesNacional>` +
    `<IncentivoFiscal>${incentivo}</IncentivoFiscal>` +
    `</InfDeclaracaoPrestacaoServico>`

  const xml = `<GerarNfseEnvio xmlns="${NS}"><Rps>${inf}</Rps></GerarNfseEnvio>`
  return { xml, id }
}

function assinar(xml: string, _id: string, keyPem: string, certBase64: string): string {
  const sig = new SignedXml({
    privateKey: keyPem,
    signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
    canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    getKeyInfoContent: () => `<X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data>`,
  })
  sig.addReference({
    xpath: `//*[local-name(.)='InfDeclaracaoPrestacaoServico']`,
    transforms: [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    ],
    digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
  })
  sig.computeSignature(xml, {
    location: { reference: `//*[local-name(.)='InfDeclaracaoPrestacaoServico']`, action: 'after' },
  })
  return sig.getSignedXml()
}

async function enviarSoap(
  endpoint: string,
  gerarNfseEnvioAssinado: string,
  keyPem: string,
  certPem: string
): Promise<{ status: number; body: string }> {
  const cabecalho = `<cabecalho versao="2.04" xmlns="${NS}"><versaoDados>2.04</versaoDados></cabecalho>`
  const soap =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:nfse="${NS_WS}">` +
    `<soapenv:Header/><soapenv:Body><nfse:GerarNfse><nfse:GerarNfseRequest>` +
    `<nfseCabecMsg>${escXml(cabecalho)}</nfseCabecMsg>` +
    `<nfseDadosMsg>${escXml(gerarNfseEnvioAssinado)}</nfseDadosMsg>` +
    `</nfse:GerarNfseRequest></nfse:GerarNfse></soapenv:Body></soapenv:Envelope>`

  const agent = new https.Agent({ key: keyPem, cert: certPem, rejectUnauthorized: false })
  const resp = await axios.post(endpoint, soap, {
    httpsAgent: agent,
    headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: `${NS_WS}/GerarNfse` },
    timeout: 60000,
    transformResponse: (x: string) => x,
    validateStatus: () => true,
  })
  return { status: resp.status as number, body: String(resp.data ?? '') }
}

function parseResposta(xmlBruto: string): { numero: string | null; codigo: string | null; erros: string[]; xml: string | null } {
  let xmlResp = xmlBruto
  const out = xmlBruto.match(/<(?:\w+:)?outputXML>([\s\S]*?)<\/(?:\w+:)?outputXML>/)
  if (out) xmlResp = unescXml(out[1])

  const get = (tag: string): string | null => {
    const m = xmlResp.match(new RegExp(`<(?:\\w+:)?${tag}>([^<]*)<\/(?:\\w+:)?${tag}>`))
    return m ? m[1] : null
  }

  const numero = get('Numero')
  const codigo = get('CodigoVerificacao')
  const erros: string[] = []
  const re = /<(?:\w+:)?MensagemRetorno>[\s\S]*?<\/(?:\w+:)?MensagemRetorno>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xmlResp))) {
    const bloco = m[0]
    const cod = (bloco.match(/<(?:\w+:)?Codigo>([^<]*)<?/) ?? [])[1] ?? ''
    const msg = (bloco.match(/<(?:\w+:)?Mensagem>([^<]*)<?/) ?? [])[1] ?? ''
    const cor = (bloco.match(/<(?:\w+:)?Correcao>([^<]*)<?/) ?? [])[1] ?? ''
    if (msg) erros.push(`${cod ? '[' + cod + '] ' : ''}${msg}${cor ? ' - ' + cor : ''}`)
  }

  let nfseXml: string | null = null
  const comp = xmlResp.match(/<(?:\w+:)?CompNfse[\s\S]*?<\/(?:\w+:)?CompNfse>/)
  const nf = xmlResp.match(/<(?:\w+:)?Nfse[ >][\s\S]*?<\/(?:\w+:)?Nfse>/)
  if (comp) nfseXml = comp[0]
  else if (nf) nfseXml = nf[0]

  return { numero, codigo, erros, xml: nfseXml }
}

export async function emitirNfse(
  cfg: NfseConfig,
  dados: DadosEmissao,
  certInfo: CertInfo
): Promise<{ ok: boolean; numero?: string; codigoVerificacao?: string | null; xml?: string | null; httpStatus?: number; erros?: string[]; respostaBruta?: string }> {
  const endpoint = cfg.urlServico.replace(/\?wsdl$/i, '')
  const { xml, id } = montarXml(cfg, dados)
  const assinado = assinar(xml, id, certInfo.keyPem, certInfo.certBase64)
  const { status, body } = await enviarSoap(endpoint, assinado, certInfo.keyPem, certInfo.certPem)
  const parsed = parseResposta(body)

  if (parsed.numero) {
    return { ok: true, numero: parsed.numero, codigoVerificacao: parsed.codigo, xml: parsed.xml, httpStatus: status }
  }
  return { ok: false, httpStatus: status, erros: parsed.erros, respostaBruta: body.slice(0, 4000) }
}

function assinarElemento(xml: string, localName: string, keyPem: string, certBase64: string): string {
  const sig = new SignedXml({
    privateKey: keyPem,
    signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
    canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    getKeyInfoContent: () => `<X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data>`,
  })
  sig.addReference({
    xpath: `//*[local-name(.)='${localName}']`,
    transforms: [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    ],
    digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
  })
  sig.computeSignature(xml, { location: { reference: `//*[local-name(.)='${localName}']`, action: 'after' } })
  return sig.getSignedXml()
}

export async function cancelarNfse(
  cfg: NfseConfig,
  dados: { numero: string; codigoCancelamento?: string },
  certInfo: CertInfo
): Promise<{ ok: boolean; erros?: string[]; respostaBruta?: string }> {
  const endpoint = cfg.urlServico.replace(/\?wsdl$/i, '')
  const cnpj = soDigitos(cfg.cnpj)
  const im = soDigitos(cfg.inscricaoMunicipal)
  const ibge = soDigitos(cfg.codigoMunicipioIbge) || '2611101'
  const numero = String(dados.numero)
  const codCanc = String(dados.codigoCancelamento ?? '1')

  const inf =
    `<InfPedidoCancelamento Id="cancel${numero}">` +
    `<IdentificacaoNfse><Numero>${esc(numero)}</Numero><CpfCnpj><Cnpj>${cnpj}</Cnpj></CpfCnpj>` +
    (im ? `<InscricaoMunicipal>${im}</InscricaoMunicipal>` : '') +
    `<CodigoMunicipio>${ibge}</CodigoMunicipio></IdentificacaoNfse>` +
    `<CodigoCancelamento>${esc(codCanc)}</CodigoCancelamento></InfPedidoCancelamento>`

  const pedidoAssinado = assinarElemento(`<Pedido>${inf}</Pedido>`, 'InfPedidoCancelamento', certInfo.keyPem, certInfo.certBase64)
  const dadosXml = `<CancelarNfseEnvio xmlns="${NS}">${pedidoAssinado}</CancelarNfseEnvio>`
  const cabecalho = `<cabecalho versao="2.04" xmlns="${NS}"><versaoDados>2.04</versaoDados></cabecalho>`
  const soap =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:nfse="${NS_WS}">` +
    `<soapenv:Header/><soapenv:Body><nfse:CancelarNfse><nfse:CancelarNfseRequest>` +
    `<nfseCabecMsg>${escXml(cabecalho)}</nfseCabecMsg><nfseDadosMsg>${escXml(dadosXml)}</nfseDadosMsg>` +
    `</nfse:CancelarNfseRequest></nfse:CancelarNfse></soapenv:Body></soapenv:Envelope>`

  const agent = new https.Agent({ key: certInfo.keyPem, cert: certInfo.certPem, rejectUnauthorized: false })
  const resp = await axios.post(endpoint, soap, {
    httpsAgent: agent,
    headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: `${NS_WS}/CancelarNfse` },
    timeout: 60000,
    transformResponse: (x: string) => x,
    validateStatus: () => true,
  })
  const body = String(resp.data ?? '')
  let out = body
  const mOut = body.match(/<outputXML>([\s\S]*?)<\/outputXML>/)
  if (mOut) out = unescXml(mOut[1])

  if (/<DataHora>/.test(out) || /Confirmacao/.test(out)) return { ok: true }
  const parsed = parseResposta(body)
  return {
    ok: false,
    erros: parsed.erros.length ? parsed.erros : ['A prefeitura recusou o cancelamento.'],
    respostaBruta: body.slice(0, 3000),
  }
}
