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
      const DUMMY = 'AAAA'

      // Testa variantes de nome de campo (qual muda o comportamento?)
      const variantes: Record<string, object> = {
        vazio: {},
        dpsXmlGZipB64: { dpsXmlGZipB64: DUMMY },
        dpsXmlB64: { dpsXmlB64: DUMMY },
        dpsXml: { dpsXml: DUMMY },
        xml: { xml: DUMMY },
        nfseXmlGZipB64: { nfseXmlGZipB64: DUMMY },
        xmlGZipB64: { xmlGZipB64: DUMMY },
      }

      const resVariantes: Record<string, unknown> = {}
      for (const [nome, payload] of Object.entries(variantes)) {
        const r = await axios.post(cfg.url_servico, payload, opts)
        resVariantes[nome] = { status: r.status, body: String(r.data ?? '').slice(0, 200) || '(vazio)' }
      }
      resultado['variantes_campo'] = resVariantes
    } catch (e: any) {
      resultado['post_com_cert_erro'] = e.message
    }
  }

  return NextResponse.json(resultado)
}
