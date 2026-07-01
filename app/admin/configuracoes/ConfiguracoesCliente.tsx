'use client'
import { useRef, useState, useEffect } from 'react'
import {
  Image as ImageIcon, Building2, Palette, Globe, Settings2, CreditCard, Banknote,
  Award, LayoutGrid, Video, ListOrdered, ListChecks, BookOpen, Smartphone,
  GraduationCap, ScrollText, Monitor, Link2, BookMarked, Shield, Lock,
  FileText, Gift, Users, UserPlus, Server, Layers, ChevronRight,
} from 'lucide-react'
import PhoneInput from '@/app/components/PhoneInput'
import CarteiraCardPreview from '@/app/components/CarteiraCardPreview'

type Config = { chave: string; valor: string | null; descricao?: string | null }

function LogoCard({ label, campo, value, desc, rec, fileRef, uploading, onUpload, onDelete }: {
 label: string; campo: string; value: string; desc: string; rec: string
 fileRef: React.RefObject<HTMLInputElement>; uploading: string
 onUpload: (campo: string, file: File) => void
 onDelete?: (campo: string) => void
}) {
 const temImagem = !!value && (value.startsWith('data:') || value.startsWith('blob:') || value.startsWith('http'))

 return (
 <div style={{ background: 'var(--avp-black)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
 <div>
 <p style={{ fontWeight: 700, fontSize: 13 }}>{label}</p>
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 2 }}>{desc}</p>
 <span style={{ fontSize: 11, color: 'var(--avp-green)', fontWeight: 700 }}> {rec}</span>
 </div>
 <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 90, background: 'var(--avp-dark)', borderRadius: 8, border: `2px dashed ${temImagem ? 'var(--avp-green)' : 'var(--avp-border)'}`, padding: 8, flexDirection: 'column', gap: 4 }}>
 {temImagem ? (
 <img src={value} alt={label} style={{ maxHeight: 74, maxWidth: '100%', objectFit: 'contain' }} />
 ) : (
 <span style={{ color: 'var(--avp-text-dim)', fontSize: 12, textAlign: 'center' }}>
 {`Nenhuma imagem · ideal: ${rec}`}
 </span>
 )}
 </div>
 <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileRef}
 onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(campo, f); e.target.value = '' }}
 />
 <div style={{ display: 'flex', gap: 8 }}>
 <button
 onClick={() => fileRef.current?.click()}
 disabled={uploading === campo}
 style={{ flex: 1, background: uploading === campo ? 'var(--avp-border)' : temImagem ? 'var(--avp-green)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: uploading === campo ? 0.7 : 1 }}>
 {uploading === campo ? ' Enviando...' : temImagem ? ' Trocar' : ' Subir imagem'}
 </button>
 {temImagem && onDelete && (
 <button
 onClick={() => { if (confirm(`Remover "${label}"?`)) onDelete(campo) }}
 style={{ background: '#e6394620', border: '1px solid #e6394640', color: 'var(--avp-danger)', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700, flexShrink: 0 }}
 title="Remover imagem">
 
 </button>
 )}
 </div>
 </div>
 )
}

function parseVal(v: string) {
 try { return JSON.parse(v) } catch { return v }
}

// Adiciona ou atualiza ?v= para forçar CDN a servir versão nova
function bustCache(url: string): string {
 if (!url || !url.startsWith('http')) return url
 const ts = Date.now()
 return url.includes('?v=') ? url.replace(/\?v=\d+/, `?v=${ts}`) : `${url}?v=${ts}`
}

export default function ConfiguracoesCliente({ configs, isMaster = false }: { configs: Config[]; isMaster?: boolean }) {
 function get(chave: string, def = '') {
 const v = configs.find(c => c.chave === chave)?.valor ?? def
 const parsed = parseVal(v)
 return typeof parsed === 'string' ? parsed : String(parsed)
 }

 const [planoPROValor, setPlanoPROValor] = useState(get('plano_pro_valor') || '97')
 const [prosGratuitoLimite, setProsGratuitoLimite] = useState(get('pros_gratuito_limite') || '20')
 const [freePodeConfigurarLink, setFreePodeConfigurarLink] = useState(get('free_pode_configurar_link') !== 'false')
 const [proPodeConfigurarLink, setProPodeConfigurarLink] = useState(get('pro_pode_configurar_link') === 'true')
 const [freeMaxModulos, setFreeMaxModulos] = useState(get('free_max_modulos') || '0')
 const [appIosUrl, setAppIosUrl] = useState(get('app_ios_url') || '')
 const [appAndroidUrl, setAppAndroidUrl] = useState(get('app_android_url') || '')
 const [logoUrl, setLogoUrl] = useState(get('site_logo_url'))
 const [logoMenuUrl, setLogoMenuUrl] = useState(get('logo_menu_url'))
 const [logoPaginaUrl, setLogoPaginaUrl] = useState(get('logo_pagina_url'))
 const [logoFaviconUrl, setLogoFaviconUrl] = useState(get('logo_favicon_url'))
 const [logoMobileUrl, setLogoMobileUrl] = useState(get('logo_mobile_url'))
 const [nome, setNome] = useState(get('site_nome'))
 const [slogan, setSlogan] = useState(get('site_slogan'))
 const [corPrimaria, setCorPrimaria] = useState(get('site_cor_primaria') || '#333687')
 const [corSecundaria, setCorSecundaria] = useState(get('site_cor_secundaria') || '#02A153')
 const [corFundo, setCorFundo] = useState(get('cor_fundo') || '#08090d')
 const [corCard, setCorCard] = useState(get('cor_card') || '#181b24')
 const [corBorda, setCorBorda] = useState(get('cor_borda') || '#252836')
 const [corTexto, setCorTexto] = useState(get('cor_texto') || '#f0f1f5')
 const [corSidebar, setCorSidebar] = useState(get('cor_sidebar') || '#181b24')

 // Aplica CSS variables em tempo real ao mudar qualquer cor
 useEffect(() => {
 const r = document.documentElement.style
 r.setProperty('--avp-blue', corPrimaria)
 r.setProperty('--avp-green', corSecundaria)
 r.setProperty('--avp-black', corFundo)
 r.setProperty('--avp-card', corCard)
 r.setProperty('--avp-border', corBorda)
 r.setProperty('--avp-text', corTexto)
 r.setProperty('--avp-sidebar', corSidebar)
 r.setProperty('--grad-brand', `linear-gradient(135deg, ${corPrimaria} 0%, ${corSecundaria} 100%)`)
 }, [corPrimaria, corSecundaria, corFundo, corCard, corBorda, corTexto, corSidebar])
 const [whatsapp, setWhatsapp] = useState(get('whatsapp_suporte'))
 const [dominio, setDominio] = useState(get('dominio_customizado'))
 const [carteiraAssinaturaNome, setCarteiraAssinaturaNome] = useState(get('carteira_assinatura_nome'))
 const [carteiraAssinaturaCargo, setCarteiraAssinaturaCargo] = useState(get('carteira_assinatura_cargo'))
 const [carteiraAssinaturaEmpresa, setCarteiraAssinaturaEmpresa] = useState(get('carteira_assinatura_empresa'))
 const [carteiraUrlVerificacao, setCarteiraUrlVerificacao] = useState(get('carteira_url_verificacao'))
 const [carteiraTagline, setCarteiraTagline] = useState(get('carteira_tagline'))
 const [carteiraLogoEsquerda, setCarteiraLogoEsquerda] = useState(get('carteira_logo_esquerda'))
 const [carteiraLogoDireita, setCarteiraLogoDireita] = useState(get('carteira_logo_direita'))
 const [carteiraAssinaturaUrl, setCarteiraAssinaturaUrl] = useState(get('carteira_assinatura_url'))
 const [carteiraQuando, setCarteiraQuando] = useState(get('carteira_quando') || 'concluido')
 const [carteiraPercentualMinimo, setCarteiraPercentualMinimo] = useState(get('carteira_percentual_minimo') || '50')
 const [boletoMensagem, setBoletoMensagem] = useState(get('boleto_mensagem'))
 const [boletoInstrucoes, setBoletoInstrucoes] = useState(get('boleto_instrucoes'))
 const [boletoMulta, setBoletoMulta] = useState(get('boleto_multa') || '2')
 const [boletoJuros, setBoletoJuros] = useState(get('boleto_juros') || '1')
 const [moduloCapaPadrao, setModuloCapaPadrao] = useState(get('modulo_capa_padrao'))
 const [freeQuizObrigatorio, setFreeQuizObrigatorio] = useState(get('free_quiz_obrigatorio') !== 'false')
 const [freeBloquearVideo, setFreeBloquearVideo] = useState(get('free_bloquear_video') !== 'false')
 const [proQuizObrigatorio, setProQuizObrigatorio] = useState(get('pro_quiz_obrigatorio') !== 'false')
 const [proBloquearVideo, setProBloquearVideo] = useState(get('pro_bloquear_video') !== 'false')
 const moduloCapaRef = useRef<HTMLInputElement>(null)
 const [captacaoVideoId, setCaptacaoVideoId] = useState(get('captacao_video_id') || '')
 const [captacaoMostrarParceiro, setCaptacaoMostrarParceiro] = useState(get('captacao_mostrar_parceiro') === 'true')
 const [captacaoBloquearParceiro, setCaptacaoBloquearParceiro] = useState(get('captacao_bloquear_parceiro') === 'true')
 const [captacaoParceiroTitulo, setCaptacaoParceiroTitulo] = useState(get('captacao_parceiro_titulo') || '')
 const [captacaoLinkExterno, setCaptacaoLinkExterno] = useState(get('captacao_link_externo') || '')
 const [captacaoMostrarApp, setCaptacaoMostrarApp] = useState(get('captacao_mostrar_app') === 'true')
 const [captacaoBloquearApp, setCaptacaoBloquearApp] = useState(get('captacao_bloquear_app') === 'true')
 const [passosPainelHabilitado, setPassosPainelHabilitado] = useState(get('passos_painel_habilitado') === 'true')
 const [certUrl, setCertUrl] = useState(get('certificado_template_url'))
 const [certNomeX, setCertNomeX] = useState(get('certificado_nome_x') || '50')
 const [certNomeY, setCertNomeY] = useState(get('certificado_nome_y') || '62')
 const [certNomeTamanho, setCertNomeTamanho] = useState(get('certificado_nome_tamanho') || '4.5')
 const [certNomeCor, setCertNomeCor] = useState(get('certificado_nome_cor') || '#1a1a2e')
 const [certCidade, setCertCidade] = useState(get('certificado_cidade'))
 const [certDataX, setCertDataX] = useState(get('certificado_data_x') || '50')
 const [certDataY, setCertDataY] = useState(get('certificado_data_y') || '72')
 const [certDataTamanho, setCertDataTamanho] = useState(get('certificado_data_tamanho') || '36')
 const [certDataCor, setCertDataCor] = useState(get('certificado_data_cor') || '#1a1a2e')
 const [certLogoEsquerda, setCertLogoEsquerda] = useState(get('cert_logo_esquerda'))
 const [certLogoDireita, setCertLogoDireita] = useState(get('cert_logo_direita'))
 const [certLogoY, setCertLogoY] = useState(get('cert_logo_y') || '88')
 const [certLogoTam, setCertLogoTam] = useState(get('cert_logo_tam') || '10')
 const [certAssinaturaY, setCertAssinaturaY] = useState(get('cert_assinatura_y') || '82')
 // Padrão true: template limpo recebe sobreposição de assinatura
 const [certAssinaturaAtiva, setCertAssinaturaAtiva] = useState(get('cert_assinatura_ativa') !== 'false')
 const [certAssinaturaUrl, setCertAssinaturaUrl] = useState(get('cert_assinatura_url'))
 const [certAssinaturaNome, setCertAssinaturaNome] = useState(get('cert_assinatura_nome'))
 const [certAssinaturaCargo, setCertAssinaturaCargo] = useState(get('cert_assinatura_cargo'))
 // Contratos Digitais (novo sistema)
 const [contratoAssinaturaUrl, setContratoAssinaturaUrl] = useState(get('contrato_assinatura_contratante_url'))
 const [salvando, setSalvando] = useState(false)
 const [msg, setMsg] = useState('')
 const [uploading, setUploading] = useState('')

 const logoUrlRef = useRef<HTMLInputElement>(null)
 const logoMenuUrlRef = useRef<HTMLInputElement>(null)
 const logoPaginaUrlRef = useRef<HTMLInputElement>(null)
 const logoFaviconUrlRef = useRef<HTMLInputElement>(null)
 const logoMobileUrlRef = useRef<HTMLInputElement>(null)
 const certUrlRef = useRef<HTMLInputElement>(null)
 const certLogoEsquerdaRef = useRef<HTMLInputElement>(null)
 const certLogoDireitaRef = useRef<HTMLInputElement>(null)
 const certAssinaturaUrlRef = useRef<HTMLInputElement>(null)
 const carteiraLogoEsquerdaRef = useRef<HTMLInputElement>(null)
 const carteiraLogoDireitaRef = useRef<HTMLInputElement>(null)
 const carteiraAssinaturaUrlRef = useRef<HTMLInputElement>(null)
 const contratoAssinaturaRef = useRef<HTMLInputElement>(null)

 const setters: Record<string, (v: string) => void> = {
 logoUrl: setLogoUrl,
 logoMenuUrl: setLogoMenuUrl,
 logoPaginaUrl: setLogoPaginaUrl,
 logoFaviconUrl: setLogoFaviconUrl,
 logoMobileUrl: setLogoMobileUrl,
 certUrl: setCertUrl,
 certLogoEsquerda: setCertLogoEsquerda,
 certLogoDireita: setCertLogoDireita,
 certAssinaturaUrl: setCertAssinaturaUrl,
 carteiraLogoEsquerda: setCarteiraLogoEsquerda,
 carteiraLogoDireita: setCarteiraLogoDireita,
 carteiraAssinaturaUrl: setCarteiraAssinaturaUrl,
 moduloCapaPadrao: setModuloCapaPadrao,
 contratoAssinaturaUrl: setContratoAssinaturaUrl,
 }

 const campoToChave: Record<string, string> = {
 logoUrl: 'site_logo_url',
 logoMenuUrl: 'logo_menu_url',
 logoPaginaUrl: 'logo_pagina_url',
 logoFaviconUrl: 'logo_favicon_url',
 logoMobileUrl: 'logo_mobile_url',
 certUrl: 'certificado_template_url',
 certLogoEsquerda: 'cert_logo_esquerda',
 certLogoDireita: 'cert_logo_direita',
 certAssinaturaUrl: 'cert_assinatura_url',
 carteiraLogoEsquerda: 'carteira_logo_esquerda',
 carteiraLogoDireita: 'carteira_logo_direita',
 carteiraAssinaturaUrl: 'carteira_assinatura_url',
 moduloCapaPadrao: 'modulo_capa_padrao',
 contratoAssinaturaUrl: 'contrato_assinatura_contratante_url',
 }

 async function uploadImagem(campo: string, file: File) {
 setUploading(campo)
 setMsg('')

 const isCert = campo === 'certUrl'
 const maxSize = isCert ? 8 * 1024 * 1024 : 2 * 1024 * 1024

 if (file.size> maxSize) {
 setMsg(` Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Limite: ${isCert ? '8MB' : '2MB'}.`)
 setUploading('')
 return
 }

 // Preview imediato com blob URL
 const blobUrl = URL.createObjectURL(file)
 if (isCert) setCertUrl(blobUrl)
 else setters[campo]?.(blobUrl)
 setMsg(' Enviando para storage...')

 try {
 const ext = file.name.split('.').pop() || (file.type.includes('png') ? 'png' : 'jpg')
 const filename = isCert ? `cert_template.${ext}` : `${campoToChave[campo] || campo}.${ext}`

 const form = new FormData()
 form.append('file', file)
 form.append('bucket', 'logos')
 form.append('path', filename)

 const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
 const data = await res.json()

 if (!res.ok || !data.url) {
 setMsg(` Erro no upload: ${data.error ?? 'tente novamente'}`)
 setUploading('')
 return
 }

 // Atualiza preview com URL permanente + cache bust para forçar reload
 const publicUrl = bustCache(data.url)
 if (isCert) setCertUrl(publicUrl)
 else setters[campo]?.(publicUrl)

 // Salva URL no banco
 const chave = isCert ? 'certificado_template_url' : campoToChave[campo]
 if (chave) {
 const saveRes = await fetch('/api/admin/configuracoes', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify([{ chave, valor: publicUrl }]),
 })
 setMsg(saveRes.ok ? ' Imagem salva!' : ' Upload ok mas erro ao salvar URL.')
 // Notifica layouts que escutam (AdminLayout, GestorLayout) para atualizar logo ao vivo
 if (saveRes.ok) {
 window.dispatchEvent(new CustomEvent('site-logo-updated', { detail: { chave, url: publicUrl } }))
 }
 } else {
 setMsg(' Upload feito!')
 }
 } catch (e: any) {
 setMsg(` Erro: ${e.message}`)
 }
 setUploading('')
 }

 async function deletarImagem(campo: string) {
 const isCert = campo === 'certUrl'
 const chave = isCert ? 'certificado_template_url' : campoToChave[campo]
 if (!chave) return
 // Limpa o estado local
 if (isCert) setCertUrl('')
 else setters[campo]?.('')
 // Persiste o vazio no banco (remove a imagem)
 await fetch('/api/admin/configuracoes', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify([{ chave, valor: '' }]),
 })
 setMsg(' Imagem removida.')
 window.dispatchEvent(new CustomEvent('site-logo-updated', { detail: { chave, url: '' } }))
 }

 async function salvar() {
 setSalvando(true)
 setMsg('')
 try {
 // Não salvar logos/cert no botão Salvar — eles são salvos individualmente no upload
 // Apenas salvar se forem URLs (não base64)
 // Aceita string vazia (deletar), rejeita apenas blobs/data: locais
 const urlSafe = (v: string) => !v.startsWith('data:') && !v.startsWith('blob:') ? v : undefined

 const body = [
 { chave: 'site_nome', valor: nome },
 { chave: 'site_slogan', valor: slogan },
 ...(urlSafe(logoUrl) ? [{ chave: 'site_logo_url', valor: logoUrl }] : []),
 ...(urlSafe(logoMenuUrl) ? [{ chave: 'logo_menu_url', valor: logoMenuUrl }] : []),
 ...(urlSafe(logoPaginaUrl) ? [{ chave: 'logo_pagina_url', valor: logoPaginaUrl }] : []),
 ...(urlSafe(logoFaviconUrl) ? [{ chave: 'logo_favicon_url', valor: logoFaviconUrl }] : []),
 ...(urlSafe(logoMobileUrl) ? [{ chave: 'logo_mobile_url', valor: logoMobileUrl }] : []),
 { chave: 'site_cor_primaria', valor: corPrimaria },
 { chave: 'site_cor_secundaria', valor: corSecundaria },
 { chave: 'cor_fundo', valor: corFundo },
 { chave: 'cor_card', valor: corCard },
 { chave: 'cor_borda', valor: corBorda },
 { chave: 'cor_texto', valor: corTexto },
 { chave: 'cor_sidebar', valor: corSidebar },
 { chave: 'whatsapp_suporte', valor: whatsapp },
 { chave: 'dominio_customizado', valor: dominio },
 { chave: 'carteira_assinatura_nome', valor: carteiraAssinaturaNome },
 { chave: 'carteira_assinatura_cargo', valor: carteiraAssinaturaCargo },
 { chave: 'carteira_assinatura_empresa', valor: carteiraAssinaturaEmpresa },
 { chave: 'carteira_url_verificacao', valor: carteiraUrlVerificacao },
 { chave: 'carteira_tagline', valor: carteiraTagline },
 { chave: 'carteira_quando', valor: carteiraQuando },
 { chave: 'carteira_percentual_minimo', valor: carteiraPercentualMinimo },
 ...(urlSafe(carteiraLogoEsquerda) ? [{ chave: 'carteira_logo_esquerda', valor: carteiraLogoEsquerda }] : []),
 ...(urlSafe(carteiraLogoDireita) ? [{ chave: 'carteira_logo_direita', valor: carteiraLogoDireita }] : []),
 ...(urlSafe(carteiraAssinaturaUrl) ? [{ chave: 'carteira_assinatura_url', valor: carteiraAssinaturaUrl }] : []),
 { chave: 'plano_pro_valor', valor: planoPROValor },
 { chave: 'pros_gratuito_limite', valor: prosGratuitoLimite },
 { chave: 'free_pode_configurar_link', valor: String(freePodeConfigurarLink) },
 { chave: 'pro_pode_configurar_link', valor: String(proPodeConfigurarLink) },
 { chave: 'free_max_modulos', valor: String(parseInt(freeMaxModulos) || 0) },
 { chave: 'app_ios_url', valor: appIosUrl },
 { chave: 'app_android_url', valor: appAndroidUrl },
 { chave: 'boleto_mensagem', valor: boletoMensagem },
 { chave: 'boleto_instrucoes', valor: boletoInstrucoes },
 { chave: 'boleto_multa', valor: boletoMulta },
 { chave: 'boleto_juros', valor: boletoJuros },
 ...(urlSafe(moduloCapaPadrao) ? [{ chave: 'modulo_capa_padrao', valor: moduloCapaPadrao }] : []),
 { chave: 'captacao_video_id', valor: captacaoVideoId },
 { chave: 'captacao_mostrar_parceiro', valor: String(captacaoMostrarParceiro) },
 { chave: 'captacao_bloquear_parceiro', valor: String(captacaoBloquearParceiro) },
 { chave: 'captacao_parceiro_titulo', valor: captacaoParceiroTitulo },
 { chave: 'captacao_link_externo', valor: captacaoLinkExterno },
 { chave: 'captacao_mostrar_app', valor: String(captacaoMostrarApp) },
 { chave: 'captacao_bloquear_app', valor: String(captacaoBloquearApp) },
 { chave: 'passos_painel_habilitado', valor: String(passosPainelHabilitado) },
 { chave: 'contrato_assinatura_contratante_url', valor: contratoAssinaturaUrl },
 { chave: 'free_quiz_obrigatorio', valor: String(freeQuizObrigatorio) },
 { chave: 'free_bloquear_video', valor: String(freeBloquearVideo) },
 { chave: 'pro_quiz_obrigatorio', valor: String(proQuizObrigatorio) },
 { chave: 'pro_bloquear_video', valor: String(proBloquearVideo) },
 ...(urlSafe(certUrl) ? [{ chave: 'certificado_template_url', valor: certUrl }] : []),
 ...(urlSafe(certLogoEsquerda) ? [{ chave: 'cert_logo_esquerda', valor: certLogoEsquerda }] : []),
 ...(urlSafe(certLogoDireita) ? [{ chave: 'cert_logo_direita', valor: certLogoDireita }] : []),
 { chave: 'cert_logo_y', valor: certLogoY },
 { chave: 'cert_logo_tam', valor: certLogoTam },
 { chave: 'cert_assinatura_y', valor: certAssinaturaY },
 { chave: 'cert_assinatura_ativa', valor: String(certAssinaturaAtiva) },
 ...(urlSafe(certAssinaturaUrl) ? [{ chave: 'cert_assinatura_url', valor: certAssinaturaUrl }] : []),
 { chave: 'cert_assinatura_nome', valor: certAssinaturaNome },
 { chave: 'cert_assinatura_cargo', valor: certAssinaturaCargo },
 { chave: 'certificado_nome_x', valor: certNomeX },
 { chave: 'certificado_nome_y', valor: certNomeY },
 { chave: 'certificado_nome_tamanho', valor: certNomeTamanho },
 { chave: 'certificado_nome_cor', valor: certNomeCor },
 { chave: 'certificado_cidade', valor: certCidade },
 { chave: 'certificado_data_x', valor: certDataX },
 { chave: 'certificado_data_y', valor: certDataY },
 { chave: 'certificado_data_tamanho', valor: certDataTamanho },
 { chave: 'certificado_data_cor', valor: certDataCor },
 ]
 const res = await fetch('/api/admin/configuracoes', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(body),
 })
 let resData: any = {}
 try { resData = await res.json() } catch { /* não-JSON */ }
 setMsg(res.ok ? ' Configurações salvas com sucesso!' : ` Erro ao salvar: ${resData.error ?? `HTTP ${res.status}`}`)
 } catch (e: any) {
 setMsg(` Erro: ${e.message}`)
 }
 setSalvando(false)
 }

 const inp: React.CSSProperties = { width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
 const lbl: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6, fontWeight: 500 }
 const card: React.CSSProperties = { background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }

 return (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 700 }}>

 {/* LOGOS */}
 <div style={{ ...card, border: '2px dashed var(--avp-border)' }}>
 <p style={{ fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><ImageIcon size={15} style={{ opacity: 0.6, flexShrink: 0 }} />Logo da empresa</p>
 <div style={{ background: 'var(--avp-black)', borderRadius: 8, padding: '8px 12px' }}>
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}><Monitor size={12} style={{ opacity: 0.7 }} />Versão Web (horizontal)</p>
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
 <LogoCard label="Logo principal" campo="logoUrl" value={logoUrl} desc="Fallback geral" rec="400×120px" fileRef={logoUrlRef} uploading={uploading} onUpload={uploadImagem} onDelete={deletarImagem} />
 <LogoCard label="Logo do menu lateral" campo="logoMenuUrl" value={logoMenuUrl} desc="Sidebar admin/PRO" rec="200×56px" fileRef={logoMenuUrlRef} uploading={uploading} onUpload={uploadImagem} onDelete={deletarImagem} />
 <LogoCard label="Logo da página de login" campo="logoPaginaUrl" value={logoPaginaUrl} desc="Login e captação" rec="300×90px" fileRef={logoPaginaUrlRef} uploading={uploading} onUpload={uploadImagem} onDelete={deletarImagem} />
 </div>
 <div style={{ background: 'var(--avp-black)', borderRadius: 8, padding: '8px 12px', marginTop: 8 }}>
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}><Smartphone size={12} style={{ opacity: 0.7 }} />Versão Mobile (quadrado)</p>
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
 <LogoCard label="Ícone mobile / PWA" campo="logoMobileUrl" value={logoMobileUrl} desc="Tela inicial do celular" rec="512×512px" fileRef={logoMobileUrlRef} uploading={uploading} onUpload={uploadImagem} onDelete={deletarImagem} />
 <LogoCard label="Favicon" campo="logoFaviconUrl" value={logoFaviconUrl} desc="Aba do navegador" rec="64×64px" fileRef={logoFaviconUrlRef} uploading={uploading} onUpload={uploadImagem} onDelete={deletarImagem} />
 </div>
 </div>

 {/* IDENTIDADE */}
 <div style={card}>
 <p style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}><Building2 size={14} style={{ opacity: 0.6 }} />Identidade</p>
 <div><label style={lbl}>Nome do site</label><input style={inp} value={nome} onChange={e => setNome(e.target.value)} /></div>
 <div><label style={lbl}>Slogan</label><input style={inp} value={slogan} onChange={e => setSlogan(e.target.value)} /></div>
 </div>

 {/* CORES */}
 <div style={card}>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
 <p style={{ fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Palette size={15} style={{ opacity: 0.6 }} />Tema de Cores</p>
 <button
 type="button"
 onClick={() => { setCorPrimaria('#333687'); setCorSecundaria('#02A153'); setCorFundo('#08090d'); setCorCard('#181b24'); setCorBorda('#252836'); setCorTexto('#f0f1f5'); setCorSidebar('#181b24') }}
 style={{ background: 'none', border: '1px solid var(--avp-border)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600 }}>
 ↺ Restaurar padrão
 </button>
 </div>

 {/* Preview ao vivo */}
 <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--avp-border)', display: 'flex', height: 160 }}>
 {/* Sidebar preview */}
 <div style={{ width: 110, background: corSidebar, borderRight: `1px solid ${corBorda}`, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
 <div style={{ height: 8, borderRadius: 4, background: `linear-gradient(90deg,${corPrimaria},${corSecundaria})`, marginBottom: 8 }} />
 {['Dashboard','FREE','Aulas'].map((item, i) => (
 <div key={item} style={{ borderRadius: 6, padding: '5px 8px', background: i === 0 ? `linear-gradient(135deg,${corPrimaria},${corSecundaria})` : 'transparent', color: i === 0 ? '#fff' : corTexto, fontSize: 10, fontWeight: i === 0 ? 700 : 400, opacity: i === 0 ? 1 : 0.6 }}>
 {item}
 </div>
 ))}
 </div>
 {/* Main area preview */}
 <div style={{ flex: 1, background: corFundo, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
 <div style={{ height: 36, background: corCard, borderRadius: 8, border: `1px solid ${corBorda}`, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8 }}>
 <div style={{ flex: 1, height: 8, borderRadius: 4, background: corBorda }} />
 <div style={{ width: 24, height: 24, borderRadius: '50%', background: `linear-gradient(135deg,${corPrimaria},${corSecundaria})` }} />
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, flex: 1 }}>
 {[0,1,2].map(i => (
 <div key={i} style={{ background: corCard, borderRadius: 8, border: `1px solid ${corBorda}`, padding: 8 }}>
 <div style={{ height: 6, borderRadius: 3, background: corBorda, marginBottom: 6 }} />
 <div style={{ height: 20, borderRadius: 4, background: i === 0 ? `linear-gradient(135deg,${corPrimaria},${corSecundaria})` : corBorda }} />
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Pickers */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
 {[
 { label: ' Cor primária', desc: 'Botões, menu ativo, gradiente', value: corPrimaria, set: setCorPrimaria },
 { label: ' Cor secundária', desc: 'Botão verde, segundo tom do gradiente', value: corSecundaria, set: setCorSecundaria },
 { label: ' Cor do fundo', desc: 'Background principal das telas', value: corFundo, set: setCorFundo },
 { label: ' Cor dos cards', desc: 'Cards e cabeçalhos', value: corCard, set: setCorCard },
 { label: ' Cor do menu lateral', desc: 'Sidebar e nav', value: corSidebar, set: setCorSidebar },
 { label: '━━ Cor das bordas', desc: 'Linhas divisórias e contornos', value: corBorda, set: setCorBorda },
 { label: ' Cor do texto', desc: 'Texto principal', value: corTexto, set: setCorTexto },
 ].map(({ label, desc, value, set }) => (
 <div key={label}>
 <label style={{ ...lbl, marginBottom: 2 }}>{label}</label>
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginBottom: 6 }}>{desc}</p>
 <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
 <input type="color" value={value} onChange={e => set(e.target.value)}
 style={{ width: 44, height: 40, border: '2px solid var(--avp-border)', borderRadius: 8, cursor: 'pointer', padding: 2, background: 'transparent', flexShrink: 0 }} />
 <input style={inp} value={value} onChange={e => set(e.target.value)} placeholder="#000000" />
 </div>
 </div>
 ))}
 </div>

 <div style={{ background: 'var(--avp-black)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--avp-text-dim)' }}>
 As cores são aplicadas em tempo real nesta página. Clique em <strong>Salvar</strong> para persistir em todos os painéis.
 </div>
 </div>

 {/* DOMÍNIO */}
 <div style={card}>
 <p style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}><Globe size={14} style={{ opacity: 0.6 }} />Domínio personalizado</p>
 <div>
 <label style={lbl}>Seu domínio</label>
 <input style={inp} value={dominio} onChange={e => setDominio(e.target.value.trim())} placeholder="Ex: universidade.suaempresa.com.br" />
 </div>
 {dominio && (
 <div style={{ background: 'var(--avp-black)', borderRadius: 10, padding: '14px 16px', fontSize: 13 }}>
 <p style={{ fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Server size={13} style={{ opacity: 0.6 }} />Configure no DNS:</p>
 <div style={{ fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: 4 }}>
 <span><span style={{ color: 'var(--avp-text-dim)' }}>Tipo:</span> <strong style={{ color: 'var(--avp-green)' }}>CNAME</strong></span>
 <span><span style={{ color: 'var(--avp-text-dim)' }}>Nome:</span> <strong>{dominio.split('.')[0]}</strong></span>
 <span><span style={{ color: 'var(--avp-text-dim)' }}>Destino:</span> <strong>cname.vercel-dns.com</strong></span>
 </div>
 </div>
 )}
 </div>

 {/* OUTROS */}
 <div style={card}>
 <p style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}><Settings2 size={14} style={{ opacity: 0.6 }} />Outros</p>
 <div><label style={lbl}>WhatsApp suporte</label><PhoneInput value={whatsapp} onChange={setWhatsapp} placeholder="suporte da empresa" /></div>
 </div>

 {/* VALOR PLANO PRO — só no painel Oito7Digital */}
 {isMaster && <div style={{ ...card, border: '2px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.05)' }}>
 <p style={{ fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><CreditCard size={15} style={{ opacity: 0.6 }} />Valor do Plano UNIAVP PRO</p>
 <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginTop: -8 }}>
 Valor cobrado mensalmente dos usuários que assinam o plano PRO via PIX. Gerado automaticamente ao assinar.
 </p>
 <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 240 }}>
 <label style={{ ...lbl, whiteSpace: 'nowrap', marginBottom: 0 }}>R$</label>
 <input style={inp} type="number" min="1" step="0.01"
 value={planoPROValor}
 onChange={e => setPlanoPROValor(e.target.value)}
 placeholder="97.00" />
 </div>
 <p style={{ fontSize: 12, color: '#818cf8', marginTop: 4 }}>
 Valor atual: <strong>R$ {parseFloat(planoPROValor || '0').toFixed(2).replace('.', ',')}</strong>/mês
 </p>
 <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 320, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--avp-border)' }}>
 <div style={{ flex: 1 }}>
 <label style={{ ...lbl, marginBottom: 4 }}>PROs necessários para plano gratuito</label>
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '0 0 8px' }}>
 Número de PROs ativos na rede do gestor para ter o plano grátis
 </p>
 </div>
 <input style={{ ...inp, width: 80, textAlign: 'center' as const }} type="number" min="1" step="1"
 value={prosGratuitoLimite}
 onChange={e => setProsGratuitoLimite(e.target.value)}
 placeholder="20" />
 </div>
 </div>}

 {/* PERMISSÕES FREE — só no super admin */}
 {isMaster && <div style={{ ...card, border: '2px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.03)' }}>
 <p style={{ fontWeight: 800, fontSize: 16 }}>🆓 Permissões do Painel FREE</p>
 <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginTop: -8, marginBottom: 16 }}>
 Controle o que os usuários FREE podem configurar no próprio perfil.
 </p>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 {/* Limite de módulos FREE */}
 <div style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '14px 16px' }}>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
 <div style={{ flex: 1 }}>
 <p style={{ fontWeight: 700, fontSize: 14, margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}><BookOpen size={13} style={{ opacity: 0.6, flexShrink: 0 }} />Limite de módulos FREE</p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '4px 0 0', lineHeight: 1.5 }}>
 Quantos módulos o FREE pode acessar (em ordem). Os demais aparecem travados como "Exclusivo PRO". Use <strong>0</strong> para ilimitado.
 </p>
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
 <input
 type="number" min={0} max={99} step={1}
 value={freeMaxModulos}
 onChange={e => setFreeMaxModulos(e.target.value)}
 style={{ width: 72, background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '8px 10px', color: 'var(--avp-text)', fontSize: 16, fontWeight: 700, textAlign: 'center', outline: 'none' }}
 />
 <span style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>módulos</span>
 </div>
 </div>
 </div>

 {/* Link da plataforma parceira */}
 <div style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '14px 16px' }}>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
 <div>
 <p style={{ fontWeight: 700, fontSize: 14, margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}><Link2 size={13} style={{ opacity: 0.6, flexShrink: 0 }} />FREE pode configurar link da plataforma parceira</p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '4px 0 0', lineHeight: 1.5 }}>
 Quando ativado, cada FREE pode colocar o próprio link de indicação no perfil dele.
 Se não tiver link próprio, usa o link do PRO que o indicou.
 </p>
 </div>
 <button onClick={() => setFreePodeConfigurarLink(v => !v)}
 style={{ flexShrink: 0, width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: freePodeConfigurarLink ? 'var(--avp-green)' : '#ef4444', position: 'relative', transition: 'background 0.2s' }}>
 <span style={{ position: 'absolute', top: 3, left: freePodeConfigurarLink ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
 </button>
 </div>
 </div>
 <div style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '14px 16px' }}>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
 <div>
 <p style={{ fontWeight: 700, fontSize: 14, margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}><Link2 size={13} style={{ opacity: 0.6, flexShrink: 0 }} />PRO pode configurar link da plataforma parceira</p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '4px 0 0', lineHeight: 1.5 }}>
 Quando ativado, cada PRO pode colocar o próprio link de indicação no perfil dele.
 Esse link aparece para os FREE que ele recrutar.
 </p>
 </div>
 <button onClick={() => setProPodeConfigurarLink(v => !v)}
 style={{ flexShrink: 0, width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: proPodeConfigurarLink ? 'var(--avp-green)' : '#ef4444', position: 'relative', transition: 'background 0.2s' }}>
 <span style={{ position: 'absolute', top: 3, left: proPodeConfigurarLink ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
 </button>
 </div>
 </div>
 </div>
 </div>}

 {/* BOLETO — só no painel Oito7Digital */}
 {isMaster && <div style={{ ...card, border: '2px dashed var(--avp-border)' }}>
 <p style={{ fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Banknote size={15} style={{ opacity: 0.6 }} />Boleto Bancário (Efí) <span style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b', background: '#f59e0b15', borderRadius: 6, padding: '2px 8px', marginLeft: 6 }}>Exclusivo Oito7Digital</span></p>
 <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginTop: -8 }}>
 Configuração exclusiva do painel master Oito7Digital — não aparece para clientes white-label. Configure a mensagem e as instruções do boleto. A logo é configurada no painel da Efí: <strong style={{ color: 'var(--avp-text)' }}>app.efipay.com.br → Minha Conta → Personalização</strong>.
 </p>
 <div>
 <label style={lbl}>Mensagem no boleto</label>
 <input style={inp} value={boletoMensagem} onChange={e => setBoletoMensagem(e.target.value)}
 placeholder="Ex: Obrigado por fazer parte da nossa plataforma!" />
 </div>
 <div>
 <label style={lbl}>Instruções ao caixa <span style={{ color: 'var(--avp-text-dim)', fontWeight: 400 }}>(uma por linha, máx. 4)</span></label>
 <textarea style={{ ...inp, minHeight: 90, resize: 'vertical' as const }}
 value={boletoInstrucoes} onChange={e => setBoletoInstrucoes(e.target.value)}
 placeholder={'Ex:\nNão receber após o vencimento\nCobrar multa de 2% após vencimento'} />
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
 <div>
 <label style={lbl}>Multa por atraso (%)</label>
 <input type="number" style={inp} value={boletoMulta} onChange={e => setBoletoMulta(e.target.value)}
 min={0} max={10} step={0.5} placeholder="2" />
 </div>
 <div>
 <label style={lbl}>Juros ao mês (%)</label>
 <input type="number" style={inp} value={boletoJuros} onChange={e => setBoletoJuros(e.target.value)}
 min={0} max={5} step={0.1} placeholder="1" />
 </div>
 </div>
 <div style={{ background: '#3b82f615', border: '1px solid #3b82f640', borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 10 }}>
 <span style={{ fontSize: 18, flexShrink: 0 }}></span>
 <div style={{ fontSize: 12, color: 'var(--avp-text-dim)', lineHeight: 1.6 }}>
 O boleto gerado também serve como <strong style={{ color: 'var(--avp-text)' }}>recibo</strong>. Após o pagamento, o recibo é acessível em <strong style={{ color: 'var(--avp-text)' }}>/recibo/[id]</strong> com logo, dados do cliente e status de pagamento.
 </div>
 </div>
 </div>}

 {/* CARTEIRA */}
 <div style={{ ...card, border: '2px dashed var(--avp-border)' }}>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
 <p style={{ fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Award size={15} style={{ opacity: 0.6 }} />Carteira de Formação</p>
 <a href="/teste/carteira" target="_blank" rel="noreferrer"
 style={{ background: '#fbbf2420', border: '1px solid #fbbf2460', color: '#fbbf24', borderRadius: 8, padding: '7px 16px', fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
 Ver modelo
 </a>
 </div>
 <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginTop: -8 }}>
 Personalize a carteirinha digital e física. Cores, logos e assinatura são exclusivos de cada associação.
 </p>

 {/* Cores da carteira — usa as cores do site */}
 <div style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '14px 16px' }}>
 <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}><Palette size={13} style={{ opacity: 0.6, flexShrink: 0 }} />Cores da carteirinha</p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '0 0 12px', lineHeight: 1.5 }}>
 A carteira usa as cores primária e secundária configuradas em <strong style={{ color: 'var(--avp-text)' }}>Tema de Cores</strong> acima.
 Cor primária = cabeçalho/fundo azul; secundária = destaques verdes/coloridos.
 </p>
 <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
 <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
 <div style={{ width: 32, height: 32, borderRadius: 6, background: corPrimaria, border: '2px solid var(--avp-border)', flexShrink: 0 }} />
 <div>
 <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--avp-text)' }}>Cor primária</p>
 <p style={{ margin: 0, fontSize: 11, color: 'var(--avp-text-dim)', fontFamily: 'monospace' }}>{corPrimaria}</p>
 </div>
 </div>
 <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
 <div style={{ width: 32, height: 32, borderRadius: 6, background: corSecundaria, border: '2px solid var(--avp-border)', flexShrink: 0 }} />
 <div>
 <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--avp-text)' }}>Cor secundária</p>
 <p style={{ margin: 0, fontSize: 11, color: 'var(--avp-text-dim)', fontFamily: 'monospace' }}>{corSecundaria}</p>
 </div>
 </div>
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: 0, flex: 1 }}>
 Altere em <strong style={{ color: 'var(--avp-text)' }}>Tema de Cores</strong> para refletir aqui.
 </p>
 </div>
 </div>
 {/* Quando exibir a carteira */}
 <div style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '14px 16px' }}>
 <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}><Settings2 size={13} style={{ opacity: 0.6, flexShrink: 0 }} />Quando mostrar a carteira no painel do aluno</p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '0 0 12px', lineHeight: 1.5 }}>
 Controla em que momento o botão da Carteira de Formação aparece para o aluno.
 </p>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
 {[
 { valor: 'sempre', label: ' Sempre — aparece logo ao entrar no painel', desc: 'O aluno vê a carteira desde o primeiro acesso' },
 { valor: 'percentual', label: ' A partir de X% do curso', desc: 'Aparece quando o aluno atinge o percentual mínimo' },
 { valor: 'concluido', label: ' Somente ao concluir 100%', desc: 'Comportamento atual — só aparece após terminar tudo' },
 ].map(op => (
 <label key={op.valor} onClick={() => setCarteiraQuando(op.valor)}
 style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', background: carteiraQuando === op.valor ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${carteiraQuando === op.valor ? 'rgba(99,102,241,0.4)' : 'var(--avp-border)'}`, borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' }}>
 <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${carteiraQuando === op.valor ? '#818cf8' : 'var(--avp-border)'}`, background: carteiraQuando === op.valor ? '#818cf8' : 'transparent', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 {carteiraQuando === op.valor && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
 </div>
 <div>
 <p style={{ fontWeight: 600, fontSize: 13, margin: 0, color: carteiraQuando === op.valor ? '#c4b5fd' : 'var(--avp-text)' }}>{op.label}</p>
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>{op.desc}</p>
 </div>
 </label>
 ))}
 </div>
 {carteiraQuando === 'percentual' && (
 <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
 <label style={{ fontSize: 13, color: 'var(--avp-text-dim)', whiteSpace: 'nowrap' }}>Percentual mínimo:</label>
 <input type="number" min={1} max={99} value={carteiraPercentualMinimo}
 onChange={e => setCarteiraPercentualMinimo(e.target.value)}
 style={{ width: 80, background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '8px 12px', color: 'var(--avp-text)', fontSize: 16, fontWeight: 700, textAlign: 'center', outline: 'none' }} />
 <span style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>% do curso</span>
 </div>
 )}
 </div>

 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
 <LogoCard label="Logo esquerda (ex: UNIAVP)" campo="carteiraLogoEsquerda" value={carteiraLogoEsquerda} desc="Logo da universidade/escola" rec="PNG transparente · 200×200px" fileRef={carteiraLogoEsquerdaRef} uploading={uploading} onUpload={uploadImagem} onDelete={deletarImagem} />
 <LogoCard label="Logo direita (ex: AUTOVALE)" campo="carteiraLogoDireita" value={carteiraLogoDireita} desc="Logo da empresa parceira" rec="PNG transparente · 300×150px" fileRef={carteiraLogoDireitaRef} uploading={uploading} onUpload={uploadImagem} onDelete={deletarImagem} />
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 4 }}>
 <LogoCard label="Imagem da assinatura" campo="carteiraAssinaturaUrl" value={carteiraAssinaturaUrl} desc="PNG da assinatura do presidente (fundo transparente)" rec="PNG transparente · 400×150px" fileRef={carteiraAssinaturaUrlRef} uploading={uploading} onUpload={uploadImagem} onDelete={deletarImagem} />
 <div style={{ background: 'var(--avp-black)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0 }}>
 Suba o PNG da assinatura digitalizada do presidente. O nome abaixo da assinatura vem do campo <strong style={{ color: 'var(--avp-text)' }}>"Nome de quem assina"</strong>.
 </p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0 }}>
 Se não subir imagem, o nome aparece em itálico como fallback.
 </p>
 </div>
 </div>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginTop: -8 }}>
 Configure abaixo a assinatura e os textos da carteira.
 </p>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
 <div>
 <label style={lbl}>Nome de quem assina</label>
 <input style={inp} value={carteiraAssinaturaNome} onChange={e => setCarteiraAssinaturaNome(e.target.value)} placeholder="Ex: Albueno" />
 </div>
 <div>
 <label style={lbl}>Cargo</label>
 <input style={inp} value={carteiraAssinaturaCargo} onChange={e => setCarteiraAssinaturaCargo(e.target.value)} placeholder="Ex: PRESIDENTE" />
 </div>
 <div>
 <label style={lbl}>Nome da empresa (sob assinatura)</label>
 <input style={inp} value={carteiraAssinaturaEmpresa} onChange={e => setCarteiraAssinaturaEmpresa(e.target.value)} placeholder="Ex: AUTOVALE PREVENÇÕES" />
 </div>
 <div>
 <label style={lbl}>URL de verificação</label>
 <input style={inp} value={carteiraUrlVerificacao} onChange={e => setCarteiraUrlVerificacao(e.target.value)} placeholder="Ex: WWW.SUAEMPRESA.COM.BR" />
 </div>
 <div style={{ gridColumn: '1 / -1' }}>
 <label style={lbl}>Tagline (rodapé)</label>
 <input style={inp} value={carteiraTagline} onChange={e => setCarteiraTagline(e.target.value)} placeholder="Ex: PROTEÇÃO VEICULAR DE VERDADE!" />
 </div>
 </div>

 {/* Preview ao vivo da carteira */}
 <div style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '20px 24px' }}>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
 <div>
 <p style={{ fontWeight: 700, fontSize: 14, margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}><Monitor size={14} style={{ opacity: 0.6, flexShrink: 0 }} />Preview ao vivo</p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '4px 0 0' }}>Atualiza em tempo real conforme você edita as configurações acima.</p>
 </div>
 <a href="/teste/carteira" target="_blank" rel="noreferrer"
 style={{ background: '#fbbf2420', border: '1px solid #fbbf2460', color: '#fbbf24', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 12, textDecoration: 'none', flexShrink: 0 }}>
 Abrir em tela cheia ↗
 </a>
 </div>
 <CarteiraCardPreview
 empresaNome={nome || 'UNIVERSIDADE'}
 logoEsquerdaUrl={carteiraLogoEsquerda || null}
 logoDireitaUrl={carteiraLogoDireita || null}
 assinaturaNome={carteiraAssinaturaNome || 'Presidente'}
 assinaturaCargo={carteiraAssinaturaCargo || 'PRESIDENTE'}
 assinaturaEmpresa={carteiraAssinaturaEmpresa || nome || ''}
 assinaturaUrl={carteiraAssinaturaUrl || null}
 urlVerificacao={carteiraUrlVerificacao || ''}
 tagline={carteiraTagline || ''}
 corPrimaria={corPrimaria || '#0D2B6E'}
 corSecundaria={corSecundaria || '#0A7A42'}
 />
 </div>
 </div>

 {/* CAPA PADRÃO DOS MÓDULOS */}
 <div style={{ ...card }}>
 <p style={{ fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><LayoutGrid size={15} style={{ opacity: 0.6 }} />Capa padrão dos módulos</p>
 <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginTop: -8, lineHeight: 1.6 }}>
 Imagem exibida nos módulos que não têm capa própria — aparece no painel Admin, PRO e FREE.
 </p>
 <LogoCard
 label="Imagem padrão dos módulos"
 campo="moduloCapaPadrao"
 value={moduloCapaPadrao}
 desc="Aparece como capa quando o módulo não tem imagem"
 rec="1380×1080px (mín.)"
 fileRef={moduloCapaRef}
 uploading={uploading}
 onUpload={(_, file) => uploadImagem('moduloCapaPadrao', file)}
 />
 {moduloCapaPadrao && moduloCapaPadrao.startsWith('http') && (
 <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
 <img src={moduloCapaPadrao} alt="preview" style={{ width: 140, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--avp-border)' }} />
 <p style={{ fontSize: 12, color: 'var(--avp-green)' }}>Imagem configurada — módulos sem capa vão usar esta</p>
 </div>
 )}
 </div>

 {/* VÍDEO DE CAPTAÇÃO */}
 <div style={{ ...card }}>
 <p style={{ fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Video size={15} style={{ opacity: 0.6 }} />Vídeo de Captação (funil de cadastro)</p>
 <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginTop: -8, lineHeight: 1.6 }}>
 Este vídeo aparece no funil de cadastro UNIAVP FREE (<strong>/g/seu-whatsapp</strong>). O candidato precisa assistir até o fim antes de se cadastrar. Cole o ID do YouTube (ex: <code style={{ background: 'var(--avp-black)', padding: '2px 6px', borderRadius: 4 }}>dQw4w9WgXcQ</code>) ou a URL completa.
 </p>
 <div>
 <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>ID ou URL do YouTube *</label>
 <input
 value={captacaoVideoId}
 onChange={e => setCaptacaoVideoId(e.target.value)}
 placeholder="Ex: dQw4w9WgXcQ ou https://youtu.be/dQw4w9WgXcQ"
 style={{ width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '11px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }}
 />
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 6 }}>
 Deixe em branco para pular a etapa do vídeo e ir direto para o formulário.
 </p>
 </div>
 {captacaoVideoId && (() => {
 const v = captacaoVideoId.trim()
 const match = v.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/) || (/^[a-zA-Z0-9_-]{11}$/.test(v) ? [null, v] : null)
 const id = match?.[1] ?? null
 return id ? (
 <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
 <img src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`} alt="preview" style={{ width: 160, height: 90, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--avp-border)', flexShrink: 0 }} />
 <div>
 <div style={{ background: '#02A15315', border: '1px solid var(--avp-green)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--avp-green)', marginBottom: 6 }}>
 ID detectado: <strong style={{ fontFamily: 'monospace', letterSpacing: 1 }}>{id}</strong>
 </div>
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: 0 }}>Candidatos precisarão assistir este vídeo antes de se cadastrar</p>
 </div>
 </div>
 ) : (
 <div style={{ background: '#e6394615', border: '1px solid var(--avp-danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--avp-danger)' }}>
 ID do YouTube não reconhecido. Cole apenas o ID (11 chars) ou a URL completa do YouTube.
 </div>
 )
 })()}

 {/* Toggle bloquear avanco do video de captacao */}
 <div style={{ background: 'var(--avp-black)', border: `1px solid ${freeBloquearVideo ? 'rgba(2,161,83,0.35)' : 'var(--avp-border)'}`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
 <div>
 <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Bloquear avanço do vídeo</p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '3px 0 0' }}>
 Quando ativado, o candidato não pode pular partes — precisa assistir do início ao fim.
 </p>
 </div>
 <button
 type="button"
 onClick={() => setFreeBloquearVideo(v => !v)}
 style={{ flexShrink: 0, width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: freeBloquearVideo ? 'var(--avp-green)' : '#ef4444', position: 'relative', transition: 'background 0.2s' }}
 >
 <span style={{ position: 'absolute', top: 3, left: freeBloquearVideo ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
 </button>
 </div>
 </div>

 {/* FLUXO PÓS-CADASTRO — passos obrigatórios */}
 <div style={{ ...card }}>
 <p style={{ fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><ListOrdered size={15} style={{ opacity: 0.6 }} />Fluxo pós-cadastro (passos obrigatórios)</p>
 <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginTop: -8, lineHeight: 1.6 }}>
 Após o consultor se cadastrar na captação, você pode exigir que ele complete etapas antes de acessar as aulas.
 A sequência é sempre: <strong style={{ color: 'var(--avp-text)' }}>1. Sistema parceiro → 2. Baixar app → Login</strong>
 </p>

 {/* ── Passo 1: Sistema parceiro ── */}
 <div style={{ background: 'var(--avp-black)', border: `1px solid ${captacaoMostrarParceiro ? 'rgba(2,161,83,0.4)' : 'var(--avp-border)'}`, borderRadius: 12, padding: '16px 18px' }}>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
 <div>
 <p style={{ fontWeight: 700, fontSize: 14, margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}><ChevronRight size={14} style={{ opacity: 0.6, flexShrink: 0 }} />Passo 1 — Cadastro no sistema parceiro</p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>
 Exibe tela pedindo que o consultor acesse o link da plataforma parceira antes de entrar no painel
 </p>
 </div>
 <button type="button" onClick={() => setCaptacaoMostrarParceiro(v => !v)}
 style={{ flexShrink: 0, width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: captacaoMostrarParceiro ? 'var(--avp-green)' : '#ef4444', position: 'relative', transition: 'background 0.2s' }}>
 <span style={{ position: 'absolute', top: 3, left: captacaoMostrarParceiro ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
 </button>
 </div>

 {/* Link sempre visível — independente do toggle estar ligado ou desligado */}
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 <div>
 <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 5, textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>
 Link do sistema parceiro (global)
 </label>
 <input value={captacaoLinkExterno} onChange={e => setCaptacaoLinkExterno(e.target.value)}
 placeholder="https://... cole o link da plataforma parceira aqui"
 style={{ width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 13px', color: 'var(--avp-text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>
 Este link aparece nos links genéricos (<code style={{ background: 'var(--avp-card)', padding: '1px 4px', borderRadius: 3 }}>/captacao</code>). Quando o consultor acessa via link do gestor (<code style={{ background: 'var(--avp-card)', padding: '1px 4px', borderRadius: 3 }}>/g/whatsapp</code>), o link do perfil do gestor tem prioridade.
 </p>
 </div>

 {captacaoMostrarParceiro && (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 6, borderTop: '1px solid var(--avp-border)' }}>
 <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', background: captacaoBloquearParceiro ? 'rgba(230,57,70,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${captacaoBloquearParceiro ? 'rgba(230,57,70,0.3)' : 'var(--avp-border)'}`, borderRadius: 8, cursor: 'pointer' }}>
 <div>
 <p style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>Obrigatório — bloquear avanço até clicar</p>
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>Consultor só continua após clicar no botão do sistema parceiro</p>
 </div>
 <button type="button" onClick={() => setCaptacaoBloquearParceiro(v => !v)}
 style={{ flexShrink: 0, width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: captacaoBloquearParceiro ? 'var(--avp-green)' : '#ef4444', position: 'relative', transition: 'background 0.2s' }}>
 <span style={{ position: 'absolute', top: 2, left: captacaoBloquearParceiro ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
 </button>
 </label>
 <div>
 <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 5, textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>Texto do botão (opcional)</label>
 <input value={captacaoParceiroTitulo} onChange={e => setCaptacaoParceiroTitulo(e.target.value)}
 placeholder="Cadastrar no sistema parceiro"
 style={{ width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 13px', color: 'var(--avp-text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
 </div>
 </div>
 )}
 </div>
 </div>

 {/* ── Passo 2: Baixar app ── */}
 <div style={{ background: 'var(--avp-black)', border: `1px solid ${captacaoMostrarApp ? 'rgba(99,102,241,0.4)' : 'var(--avp-border)'}`, borderRadius: 12, padding: '16px 18px' }}>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: captacaoMostrarApp ? 16 : 0 }}>
 <div>
 <p style={{ fontWeight: 700, fontSize: 14, margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}><ChevronRight size={14} style={{ opacity: 0.6, flexShrink: 0 }} />Passo 2 — Baixar o app do consultor</p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>
 Exibe tela com os botões da App Store e Google Play (links configurados abaixo)
 </p>
 </div>
 <button type="button" onClick={() => setCaptacaoMostrarApp(v => !v)}
 style={{ flexShrink: 0, width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: captacaoMostrarApp ? 'var(--avp-green)' : '#ef4444', position: 'relative', transition: 'background 0.2s' }}>
 <span style={{ position: 'absolute', top: 3, left: captacaoMostrarApp ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
 </button>
 </div>

 {captacaoMostrarApp && (
 <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', background: captacaoBloquearApp ? 'rgba(230,57,70,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${captacaoBloquearApp ? 'rgba(230,57,70,0.3)' : 'var(--avp-border)'}`, borderRadius: 8, cursor: 'pointer' }}>
 <div>
 <p style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>Obrigatório — bloquear avanço até clicar</p>
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>Consultor só vai para o login após clicar em um dos botões do app</p>
 </div>
 <button type="button" onClick={() => setCaptacaoBloquearApp(v => !v)}
 style={{ flexShrink: 0, width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: captacaoBloquearApp ? 'var(--avp-green)' : '#ef4444', position: 'relative', transition: 'background 0.2s' }}>
 <span style={{ position: 'absolute', top: 2, left: captacaoBloquearApp ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
 </button>
 </label>
 )}
 </div>
 </div>

 {/* PASSOS INICIAIS NO PAINEL */}
 <div style={{ ...card, border: `2px solid ${passosPainelHabilitado ? 'rgba(2,161,83,0.35)' : 'var(--avp-border)'}`, background: passosPainelHabilitado ? 'rgba(2,161,83,0.03)' : undefined }}>
 <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
 <div>
 <p style={{ fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><ListChecks size={15} style={{ opacity: 0.6 }} />Passos iniciais no painel do aluno</p>
 <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginTop: 4, lineHeight: 1.6 }}>
 Quando ativado, o aluno vê os passos configurados acima (parceiro + app) assim que entra no painel — <strong style={{ color: 'var(--avp-text)' }}>antes de acessar as aulas</strong>. Ideal para garantir que ele já tem o app e o cadastro no sistema parceiro antes de começar.
 </p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginTop: 6 }}>
 Os passos exibidos são os mesmos configurados em <strong style={{ color: 'var(--avp-text)' }}>Fluxo pós-cadastro</strong> acima.
 Se desativar "mostrar" nos passos, eles não aparecem aqui também.
 </p>
 </div>
 <button type="button" onClick={() => setPassosPainelHabilitado(v => !v)}
 style={{ flexShrink: 0, width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: passosPainelHabilitado ? 'var(--avp-green)' : '#ef4444', position: 'relative', transition: 'background 0.2s' }}>
 <span style={{ position: 'absolute', top: 3, left: passosPainelHabilitado ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
 </button>
 </div>
 </div>

 {/* REGRAS DE APRENDIZADO */}
 <div style={card}>
 <p style={{ fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><BookOpen size={15} style={{ opacity: 0.6 }} />Regras de Aprendizado</p>
 <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginTop: -8, lineHeight: 1.6 }}>
 Controle o comportamento das aulas para cada tipo de usuário. Essas regras se aplicam globalmente, independente da configuração individual de cada aula.
 </p>

 {([
 { titulo: '🆓 Usuários FREE', quizKey: 'freeQuiz', videoKey: 'freeVideo', quiz: freeQuizObrigatorio, setQuiz: setFreeQuizObrigatorio, video: freeBloquearVideo, setVideo: setFreeBloquearVideo },
 { titulo: ' Usuários PRO', quizKey: 'proQuiz', videoKey: 'proVideo', quiz: proQuizObrigatorio, setQuiz: setProQuizObrigatorio, video: proBloquearVideo, setVideo: setProBloquearVideo },
 ] as const).map(({ titulo, quiz, setQuiz, video, setVideo, quizKey, videoKey }) => (
 <div key={quizKey} style={{ background: 'var(--avp-black)', borderRadius: 10, padding: '16px 20px' }}>
 <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>{titulo}</p>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

 {/* Quiz obrigatório */}
 <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 12 }}>
 <div>
 <p style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>Quiz obrigatório para avançar</p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>
 {quiz ? 'Aluno deve responder e ser aprovado no quiz antes da próxima aula' : 'Aluno pode pular o quiz e avançar livremente'}
 </p>
 </div>
 <div onClick={() => setQuiz(v => !v)}
 style={{ width: 44, height: 24, borderRadius: 12, background: quiz ? 'var(--avp-green)' : '#ef4444', position: 'relative', flexShrink: 0, cursor: 'pointer', transition: 'background 0.2s' }}>
 <div style={{ position: 'absolute', top: 3, left: quiz ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
 </div>
 </label>

 {/* Bloquear avanço do vídeo */}
 <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 12 }}>
 <div>
 <p style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>Bloquear avanço do vídeo</p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>
 {video ? 'Aluno deve assistir o vídeo do início ao fim, sem poder avançar' : 'Aluno pode avançar o vídeo livremente'}
 </p>
 </div>
 <div onClick={() => setVideo(v => !v)}
 style={{ width: 44, height: 24, borderRadius: 12, background: video ? 'var(--avp-green)' : '#ef4444', position: 'relative', flexShrink: 0, cursor: 'pointer', transition: 'background 0.2s' }}>
 <div style={{ position: 'absolute', top: 3, left: video ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
 </div>
 </label>

 </div>
 </div>
 ))}
 </div>

 {/* LINKS DO APP */}
 <div style={{ ...card, border: '2px solid rgba(99,102,241,0.25)' }}>
 <p style={{ fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Smartphone size={15} style={{ opacity: 0.6 }} />Links de Download do App Consultor</p>
 <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginTop: -8, marginBottom: 20 }}>
 Configure os links da loja para o app consultor. Quando ativado em uma aula, o aluno verá dois botões para baixar o app após concluir o vídeo.
 </p>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
 <div>
 <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>
 Link App Store (iOS)
 </label>
 <input style={{ width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }}
 value={appIosUrl} onChange={e => setAppIosUrl(e.target.value)}
 placeholder="https://apps.apple.com/..." />
 </div>
 <div>
 <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>
 Link Google Play (Android)
 </label>
 <input style={{ width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }}
 value={appAndroidUrl} onChange={e => setAppAndroidUrl(e.target.value)}
 placeholder="https://play.google.com/..." />
 </div>
 </div>
 </div>

 {/* CERTIFICADO — removido: cada módulo tem seu próprio certificado agora */}
 {false && <div style={{ ...card, border: '2px dashed var(--avp-border)' }}>
 <p style={{ fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><GraduationCap size={15} style={{ opacity: 0.6 }} />Certificado de Conclusão</p>
 <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginTop: -8 }}>
 Faça upload do template PNG e configure onde o nome do aluno aparece. O certificado baixado terá o nome gravado na posição definida.
 </p>

 <LogoCard label="Template do certificado" campo="certUrl" value={certUrl} desc="PNG em alta resolução — A4 paisagem" rec="2480×1748px (mín.)" fileRef={certUrlRef} uploading={uploading} onUpload={uploadImagem} onDelete={deletarImagem} />

 {/* Logos esquerda e direita do certificado */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
 <LogoCard label="Logo esquerda (certificado)" campo="certLogoEsquerda" value={certLogoEsquerda} desc="Ex: logo da escola/empresa" rec="PNG transparente" fileRef={certLogoEsquerdaRef} uploading={uploading} onUpload={uploadImagem} onDelete={deletarImagem} />
 <LogoCard label="Logo direita (certificado)" campo="certLogoDireita" value={certLogoDireita} desc="Ex: logo da parceira/credenciadora" rec="PNG transparente" fileRef={certLogoDireitaRef} uploading={uploading} onUpload={uploadImagem} onDelete={deletarImagem} />
 </div>

 {/* Posição e tamanho dos logos */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
 <div>
 <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Posição vertical dos logos (%)</label>
 <input type="number" min={0} max={100} value={certLogoY} onChange={e => setCertLogoY(e.target.value)}
 style={{ width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} />
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>0 = topo · 100 = base · padrão: 88</p>
 </div>
 <div>
 <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Tamanho dos logos (%)</label>
 <input type="number" min={1} max={30} step={0.5} value={certLogoTam} onChange={e => setCertLogoTam(e.target.value)}
 style={{ width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} />
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>% da altura do certificado · padrão: 10</p>
 </div>
 </div>

 {/* Campos de posicionamento do nome */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
 <div>
 <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Posição vertical do nome (%)</label>
 <input type="number" min={0} max={100} value={certNomeY} onChange={e => setCertNomeY(e.target.value)}
 style={{ width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} />
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>0 = topo · 100 = base · padrão: 63</p>
 </div>
 <div>
 <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Tamanho da fonte (%)</label>
 <div style={{ display: 'flex', gap: 6 }}>
 <input type="number" min={1} max={8} step={0.1} value={certNomeTamanho} onChange={e => setCertNomeTamanho(e.target.value)}
 style={{ flex: 1, background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} />
 <button type="button" onClick={() => setCertNomeTamanho('4.5')}
 style={{ background: 'var(--avp-border)', border: 'none', borderRadius: 8, padding: '0 12px', color: 'var(--avp-text-dim)', fontSize: 12, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' as const }}>
 Padrão
 </button>
 </div>
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>% da largura · mín 1 · máx 8 · padrão: 4.5</p>
 </div>
 <div>
 <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Cor do nome</label>
 <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
 <input type="color" value={certNomeCor} onChange={e => setCertNomeCor(e.target.value)}
 style={{ width: 44, height: 40, borderRadius: 6, border: '1px solid var(--avp-border)', background: 'none', cursor: 'pointer', padding: 2 }} />
 <input value={certNomeCor} onChange={e => setCertNomeCor(e.target.value)}
 style={{ flex: 1, background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
 </div>
 </div>
 </div>

 {/* Toggle assinatura */}
 <div style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '14px 16px' }}>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
 <div>
 <p style={{ fontWeight: 700, fontSize: 14, margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}><Layers size={14} style={{ opacity: 0.6, flexShrink: 0 }} />Sobrepor assinatura no certificado</p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '4px 0 0', lineHeight: 1.5 }}>
 Ative <strong>somente</strong> se o template <strong>não</strong> tiver assinatura gravada. Se o PNG já tem assinatura, deixe desligado para não duplicar.
 </p>
 </div>
 <button
 onClick={() => setCertAssinaturaAtiva(v => !v)}
 style={{ flexShrink: 0, width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: certAssinaturaAtiva ? 'var(--avp-green)' : '#ef4444', position: 'relative', transition: 'background 0.2s' }}>
 <span style={{ position: 'absolute', top: 3, left: certAssinaturaAtiva ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
 </button>
 </div>
 {certAssinaturaAtiva && (
 <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
 {/* Upload da assinatura do presidente */}
 <LogoCard
 label="Assinatura do Presidente (certificado)"
 campo="certAssinaturaUrl"
 value={certAssinaturaUrl}
 desc="PNG com fundo transparente — assinatura manuscrita"
 rec="PNG transparente · 400×150px"
 fileRef={certAssinaturaUrlRef}
 uploading={uploading}
 onUpload={uploadImagem}
 onDelete={deletarImagem}
 />
 {/* Nome e cargo */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
 <div>
 <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Nome de quem assina</label>
 <input value={certAssinaturaNome} onChange={e => setCertAssinaturaNome(e.target.value)}
 placeholder="Ex: TIBURCIO FILHO"
 style={{ width: '100%', background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} />
 </div>
 <div>
 <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Cargo</label>
 <input value={certAssinaturaCargo} onChange={e => setCertAssinaturaCargo(e.target.value)}
 placeholder="Ex: PRESIDENTE"
 style={{ width: '100%', background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} />
 </div>
 </div>
 {/* Posição vertical */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
 <div>
 <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Posição vertical da linha (%)</label>
 <input type="number" min={0} max={100} value={certAssinaturaY} onChange={e => setCertAssinaturaY(e.target.value)}
 style={{ width: '100%', background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} />
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>0 = topo · 100 = base · padrão: 82</p>
 </div>
 <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0, lineHeight: 1.5 }}>
 Se não preencher aqui, usa automaticamente a assinatura da Carteirinha como fallback.
 </p>
 </div>
 </div>
 </div>
 )}
 </div>

 {/* Preview visual do certificado completo */}
 {certUrl && certUrl.startsWith('http') && (
 <div>
 <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 10 }}>Preview completo</p>
 <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--avp-border)', position: 'relative', containerType: 'inline-size' }}>
 <img src={certUrl} alt="Certificado" style={{ width: '100%', display: 'block', objectFit: 'contain' }} />
 {/* Nome */}
 <div style={{
 position: 'absolute', left: '50%', transform: 'translateX(-50%)',
 top: `${certNomeY}%`, width: '80%', textAlign: 'center',
 fontFamily: 'Georgia, serif', fontWeight: 700,
 fontSize: `${Math.min(Number(certNomeTamanho) || 4.5, 6)}cqw`,
 color: certNomeCor, textTransform: 'uppercase' as const,
 letterSpacing: 2, pointerEvents: 'none', lineHeight: 1.2,
 }}>
 Nome do Aluno
 </div>
 {/* Logo esquerda — usa cert ou fallback carteirinha */}
 {(certLogoEsquerda || carteiraLogoEsquerda) && (
 <img src={certLogoEsquerda || carteiraLogoEsquerda} alt="logo esq"
 style={{ position: 'absolute', left: '5%', top: `${certLogoY}%`, transform: 'translateY(-50%)', height: `${certLogoTam}%`, objectFit: 'contain', pointerEvents: 'none' }} />
 )}
 {/* Logo direita */}
 {(certLogoDireita || carteiraLogoDireita) && (
 <img src={certLogoDireita || carteiraLogoDireita} alt="logo dir"
 style={{ position: 'absolute', right: '5%', top: `${certLogoY}%`, transform: 'translateY(-50%)', height: `${certLogoTam}%`, objectFit: 'contain', pointerEvents: 'none' }} />
 )}
 {/* Assinatura — só quando ativa, usa a do cert ou fallback carteirinha */}
 {certAssinaturaAtiva && (certAssinaturaUrl || certAssinaturaNome || carteiraAssinaturaUrl || carteiraAssinaturaNome) && (
 <div style={{ position: 'absolute', left: '10%', top: `${certAssinaturaY}%`, transform: 'translateY(-100%)', pointerEvents: 'none', textAlign: 'left' }}>
 {(certAssinaturaUrl || carteiraAssinaturaUrl) && (
 <img src={certAssinaturaUrl || carteiraAssinaturaUrl} alt="assinatura"
 style={{ height: '5cqw', maxWidth: '20cqw', objectFit: 'contain', display: 'block', marginBottom: '0.2cqw' }} />
 )}
 <div style={{ width: '20cqw', height: 1, background: '#444', marginBottom: '0.3cqw' }} />
 {(certAssinaturaNome || carteiraAssinaturaNome) && (
 <p style={{ margin: 0, fontSize: '1.1cqw', fontWeight: 700, color: '#1a1a1a' }}>{certAssinaturaNome || carteiraAssinaturaNome}</p>
 )}
 {(certAssinaturaCargo || carteiraAssinaturaCargo) && (
 <p style={{ margin: 0, fontSize: '0.9cqw', color: '#555' }}>{certAssinaturaCargo || carteiraAssinaturaCargo}</p>
 )}
 </div>
 )}
 </div>
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 8 }}>
 Ajuste os valores acima e veja o resultado em tempo real
 </p>
 </div>
 )}
 </div>}


 {/* CONTRATOS DIGITAIS */}
 <div id="contrato" style={{ ...card, border: '2px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.03)', scrollMarginTop: 80 }}>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
 <div>
 <p style={{ fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><ScrollText size={15} style={{ opacity: 0.6 }} />Contratos Digitais</p>
 <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginTop: 4 }}>
 Envie contratos individuais por WhatsApp ou email. O destinatario abre o link, preenche os proprios dados, le e assina digitalmente. Todos recebem copia por email apos conclusao.
 </p>
 </div>
 <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
 <a href="/admin/contratos" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', borderRadius: 8, padding: '7px 16px', fontWeight: 700, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}>
 Ver contratos →
 </a>
 <a href="/admin/contratos/novo" style={{ background: 'var(--avp-green)', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 16px', fontWeight: 700, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}>
 + Novo contrato
 </a>
 </div>
 </div>

 {/* Como funciona */}
 <div style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '14px 16px' }}>
 <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 12px' }}>Como funciona</p>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 {[
 { n: '1', titulo: 'Voce cria o contrato', desc: 'Escreve o corpo em HTML com variaveis como {{nome}}, {{cpf}}, {{data}}. Pode usar um template ou escrever do zero.' },
 { n: '2', titulo: 'Voce informa o contato do destinatario', desc: 'Apenas WhatsApp ou email. Nao precisa preencher nome nem CPF: o proprio destinatario preenche ao abrir.' },
 { n: '3', titulo: 'Destinatario recebe o link', desc: 'Preenche nome e CPF, le o contrato com os dados inseridos, e assina digitalmente com validade juridica (Lei 14.063/2020).' },
 { n: '4', titulo: 'Copia por email', desc: 'Quando todos assinam, cada parte com email cadastrado recebe uma copia completa do documento.' },
 ].map(p => (
 <div key={p.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
 <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>{p.n}</div>
 <div>
 <p style={{ fontWeight: 600, fontSize: 13, margin: '0 0 2px', color: 'var(--avp-text)' }}>{p.titulo}</p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0, lineHeight: 1.5 }}>{p.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Templates */}
 <div style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '14px 16px' }}>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
 <p style={{ fontWeight: 700, fontSize: 13, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={13} style={{ opacity: 0.6 }} />Templates de contrato</p>
 <a href="/admin/contratos/templates" style={{ fontSize: 12, color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}>Gerenciar templates →</a>
 </div>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0, lineHeight: 1.5 }}>
 Crie templates reutilizaveis com HTML e variaveis. Ao criar um contrato, selecione um template e o corpo e carregado automaticamente, podendo ser editado antes do envio.
 </p>
 </div>

 {/* Assinatura do representante */}
 <div style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '14px 16px' }}>
 <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={13} style={{ opacity: 0.6, flexShrink: 0 }} />Assinatura do Representante (pre-assina automaticamente)</p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '0 0 12px', lineHeight: 1.6 }}>
 Imagem PNG da assinatura do responsavel legal da sua empresa. Quando configurada, todo contrato criado ja sai pre-assinado pelo lado da contratante. Fundo transparente fica melhor.
 </p>
 <input ref={contratoAssinaturaRef} type="file" accept="image/*" style={{ display: 'none' }}
 onChange={e => { const f = e.target.files?.[0]; if (f) { uploadImagem('contratoAssinaturaUrl', f); e.target.value = '' } }}
 />
 <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
 {contratoAssinaturaUrl && (
 <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 140 }}>
 <img src={contratoAssinaturaUrl} alt="Assinatura representante" style={{ maxHeight: 60, maxWidth: 180, objectFit: 'contain' }} />
 </div>
 )}
 <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
 <button type="button"
 onClick={() => contratoAssinaturaRef.current?.click()}
 disabled={uploading === 'contratoAssinaturaUrl'}
 style={{ background: uploading === 'contratoAssinaturaUrl' ? 'var(--avp-border)' : contratoAssinaturaUrl ? 'var(--avp-green)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
 {uploading === 'contratoAssinaturaUrl' ? 'Enviando...' : contratoAssinaturaUrl ? 'Trocar assinatura' : 'Subir assinatura (PNG)'}
 </button>
 {contratoAssinaturaUrl && (
 <button type="button"
 onClick={() => { if (confirm('Remover assinatura do representante?')) setContratoAssinaturaUrl('') }}
 style={{ background: '#e6394620', border: '1px solid #e6394640', color: 'var(--avp-danger)', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
 Remover
 </button>
 )}
 </div>
 </div>
 </div>
 </div>

 {msg && (
 <div style={{ padding: '12px 16px', background: msg.includes('') ? '#02A15320' : '#e6394620', border: `1px solid ${msg.includes('') ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msg.includes('') ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 14 }}>
 {msg}
 </div>
 )}

 <button onClick={salvar} disabled={salvando}
 style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '13px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: salvando ? 0.7 : 1, alignSelf: 'flex-start' }}>
 {salvando ? ' Salvando...' : ' Salvar configurações'}
 </button>
 </div>
 )
}
