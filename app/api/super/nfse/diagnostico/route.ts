import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { decCert, carregarCertificadoDePem } from '@/lib/nfse-engine'
import https from 'https'
import axios from 'axios'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

async function isSuperAdmin(userId: string, sb: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await sb.from('super_admins').select('id').eq('user_id', userId).eq('ativo', true).maybeSingle()
  return !!data
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const sb = createServiceRoleClient()
  if (!await isSuperAdmin(user.id, sb)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { data: cfg } = await (sb as any).from('nfse_config').select('*').eq('id', 'default').maybeSingle()
  if (!cfg) return NextResponse.json({ error: 'Config não encontrada' }, { status: 500 })

  const resultado: Record<string, unknown> = {
    url: cfg.url_servico,
    cnpj: cfg.cnpj,
    inscricao_municipal: cfg.inscricao_municipal,
    tem_key_pem: !!cfg.key_pem_enc,
    tem_cert_pem: !!cfg.cert_pem_enc,
  }

  // Testa 1: GET na URL (deve dar 403 ou 405)
  try {
    const r = await axios.get(cfg.url_servico, { validateStatus: () => true, timeout: 10000 })
    resultado['get_status'] = r.status
    resultado['get_body'] = String(r.data ?? '').slice(0, 300)
  } catch (e: any) {
    resultado['get_erro'] = e.message
  }

  // Testa 2: POST vazio sem cert
  try {
    const r = await axios.post(cfg.url_servico, {}, { validateStatus: () => true, timeout: 10000 })
    resultado['post_sem_cert_status'] = r.status
    resultado['post_sem_cert_body'] = String(r.data ?? '').slice(0, 300)
    resultado['post_sem_cert_headers'] = r.headers
  } catch (e: any) {
    resultado['post_sem_cert_erro'] = e.message
  }

  // Testa 3: POST com varios nomes de campo (detecta qual o servidor aceita)
  if (cfg.key_pem_enc && cfg.cert_pem_enc) {
    try {
      const keyPem = decCert(cfg.key_pem_enc).toString('utf8')
      const certPem = decCert(cfg.cert_pem_enc).toString('utf8')
      const certInfo = carregarCertificadoDePem(keyPem, certPem)
      resultado['cert_valido_ate'] = certInfo.validoAte
      resultado['cert_titular'] = certInfo.titular

      const agent = new https.Agent({ key: keyPem, cert: certPem, rejectUnauthorized: false })
      const opts = { httpsAgent: agent, headers: { 'Content-Type': 'application/json' }, validateStatus: () => true, timeout: 10000 }
      const DUMMY_XML = '<?xml version="1.0" encoding="UTF-8"?><DPS versao="1.00" xmlns="http://www.sped.fazenda.gov.br/nfse"><infDPS Id="DPS00000000000000000000000000000000000000"/></DPS>'
      const DUMMY_B64 = Buffer.from(DUMMY_XML, 'utf-8').toString('base64')
      const DUMMY_GZIP_B64 = (await gzipAsync(Buffer.from(DUMMY_XML, 'utf-8'))).toString('base64')

      // Testa formatos de body (qual muda o status/body da resposta?)
      const testes: Array<{ nome: string; body: unknown; ct: string }> = [
        { nome: 'json_vazio', body: {}, ct: 'application/json' },
        { nome: 'json_dpsXmlGZipB64', body: { dpsXmlGZipB64: DUMMY_GZIP_B64 }, ct: 'application/json' },
        { nome: 'json_dpsXmlB64', body: { dpsXmlB64: DUMMY_B64 }, ct: 'application/json' },
        { nome: 'xml_direto', body: DUMMY_XML, ct: 'application/xml' },
        { nome: 'xml_direto_text', body: DUMMY_XML, ct: 'text/xml' },
        { nome: 'json_dpsXmlGZipB64_accept_json', body: { dpsXmlGZipB64: DUMMY_GZIP_B64 }, ct: 'application/json' },
      ]

      const resVariantes: Record<string, unknown> = {}
      for (const t of testes) {
        const r = await axios.post(cfg.url_servico, t.body, {
          ...opts,
          headers: { 'Content-Type': t.ct, Accept: 'application/json, application/xml, */*' },
          transformResponse: (x: string) => x,
        })
        resVariantes[t.nome] = { status: r.status, body: (String(r.data ?? '').slice(0, 300) || '(vazio)'), connClose: r.headers?.['connection'] === 'close' }
      }
      resultado['variantes_campo'] = resVariantes
    } catch (e: any) {
      resultado['post_com_cert_erro'] = e.message
    }
  }

  return NextResponse.json(resultado)
}
