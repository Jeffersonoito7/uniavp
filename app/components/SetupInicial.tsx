'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  whatsapp: string
  mostrarParceiro: boolean
  bloquearParceiro: boolean
  parceiroTitulo?: string
  linkParceiro?: string
  mostrarApp: boolean
  bloquearApp: boolean
  appIosUrl?: string
  appAndroidUrl?: string
}

export default function SetupInicial({
  whatsapp, mostrarParceiro, bloquearParceiro, parceiroTitulo,
  linkParceiro, mostrarApp, bloquearApp, appIosUrl, appAndroidUrl,
}: Props) {
  const router = useRouter()
  const temApp = !!(appIosUrl || appAndroidUrl)
  const total = (mostrarParceiro ? 1 : 0) + (mostrarApp && temApp ? 1 : 0)

  const primeiroPassoEhParceiro = mostrarParceiro
  const [passo, setPasso] = useState<'parceiro' | 'app'>(
    primeiroPassoEhParceiro ? 'parceiro' : 'app'
  )
  const [concluindo, setConcluindo] = useState(false)

  const passosFeitos = {
    parceiro: passo === 'app' || (!mostrarApp),
    app: false,
  }

  const atual = passo === 'parceiro' ? 1 : (mostrarParceiro ? 2 : 1)

  async function concluir() {
    setConcluindo(true)
    await fetch('/api/aluno/setup-concluido', { method: 'POST' })
    router.refresh()
  }

  function avancarParaApp() {
    if (mostrarApp && temApp) {
      setPasso('app')
    } else {
      concluir()
    }
  }

  const bg = 'linear-gradient(135deg, #020d1a 0%, #03183a 60%, #021a0e 100%)'

  // ── PASSO PARCEIRO ───────────────────────────────────────────────
  if (passo === 'parceiro') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '24px 20px' }}>
        <div style={{ maxWidth: 540, width: '100%', textAlign: 'center', color: '#fff' }}>

          {total > 1 && <Indicador total={total} atual={atual} />}

          <div style={{ fontSize: 52, marginBottom: 16 }}>🔗</div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#02A153', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
            {total > 1 ? `Passo ${atual} de ${total}` : 'Antes de começar'}
          </p>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12 }}>Cadastre-se no Sistema Parceiro</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
            Para ter acesso completo às aulas, você precisa se cadastrar no sistema parceiro do seu gestor.
          </p>

          <div style={{ background: 'rgba(2,161,83,0.08)', border: '2px solid rgba(2,161,83,0.4)', borderRadius: 20, padding: '28px 24px', marginBottom: 20 }}>
            {linkParceiro ? (
              <a href={linkParceiro} target="_blank" rel="noopener noreferrer"
                onClick={() => { if (!bloquearParceiro) setTimeout(avancarParaApp, 1000) }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'linear-gradient(135deg, #02A153, #059669)', color: '#fff', borderRadius: 14, padding: '18px 32px', fontWeight: 900, fontSize: 18, textDecoration: 'none', boxShadow: '0 8px 32px rgba(2,161,83,0.4)', marginBottom: 14 }}>
                🔗 {parceiroTitulo || 'Cadastrar no sistema parceiro'} →
              </a>
            ) : (
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 14, lineHeight: 1.6 }}>
                📲 Solicite o link de cadastro ao seu gestor e acesse o sistema parceiro antes de continuar.
              </p>
            )}
          </div>

          {(!bloquearParceiro || !linkParceiro) && (
            <button onClick={avancarParaApp}
              style={{ background: 'linear-gradient(135deg, #02A153, #059669)', border: 'none', color: '#fff', borderRadius: 12, padding: '14px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', width: '100%', boxShadow: '0 4px 16px rgba(2,161,83,0.3)' }}>
              {linkParceiro ? 'Já me cadastrei → Continuar' : 'Continuar →'}
            </button>
          )}
          {bloquearParceiro && linkParceiro && (
            <button onClick={avancarParaApp}
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: '14px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', width: '100%' }}>
              Já me cadastrei → Continuar
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── PASSO APP ────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '24px 20px' }}>
      <div style={{ maxWidth: 540, width: '100%', textAlign: 'center', color: '#fff' }}>

        {total > 1 && <Indicador total={total} atual={atual} concluidos={mostrarParceiro ? 1 : 0} />}

        <div style={{ fontSize: 52, marginBottom: 16 }}>📱</div>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
          {total > 1 ? `Passo ${atual} de ${total}` : 'Antes de começar'}
        </p>
        <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12 }}>Baixe o App do Consultor</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
          Instale o aplicativo para acompanhar indicações, comissões e métricas em tempo real.
        </p>

        <div style={{ background: 'rgba(99,102,241,0.08)', border: '2px solid rgba(99,102,241,0.35)', borderRadius: 20, padding: '28px 24px', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {appIosUrl && (
            <a href={appIosUrl} target="_blank" rel="noopener noreferrer"
              onClick={() => { if (!bloquearApp) setTimeout(concluir, 800) }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#000', color: '#fff', borderRadius: 14, padding: '16px 24px', fontWeight: 800, fontSize: 17, textDecoration: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
              🍎 <span>Baixar na App Store<br /><span style={{ fontSize: 11, fontWeight: 400, opacity: 0.7 }}>iOS / iPhone</span></span>
            </a>
          )}
          {appAndroidUrl && (
            <a href={appAndroidUrl} target="_blank" rel="noopener noreferrer"
              onClick={() => { if (!bloquearApp) setTimeout(concluir, 800) }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#01875f', color: '#fff', borderRadius: 14, padding: '16px 24px', fontWeight: 800, fontSize: 17, textDecoration: 'none', boxShadow: '0 4px 16px rgba(1,135,95,0.4)' }}>
              🤖 <span>Baixar no Google Play<br /><span style={{ fontSize: 11, fontWeight: 400, opacity: 0.7 }}>Android</span></span>
            </a>
          )}
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '4px 0 0' }}>
            {bloquearApp ? 'Baixe o app e depois clique em continuar abaixo.' : 'Após baixar, você será liberado automaticamente.'}
          </p>
        </div>

        {bloquearApp && (
          <button onClick={concluir} disabled={concluindo}
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: '14px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', width: '100%', opacity: concluindo ? 0.7 : 1 }}>
            {concluindo ? '⏳ Liberando...' : 'Já baixei o app → Acessar as aulas'}
          </button>
        )}
      </div>
    </div>
  )
}

function Indicador({ total, atual, concluidos = 0 }: { total: number; atual: number; concluidos?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: i < concluidos ? '#02A153' : i === atual - 1 ? 'rgba(99,102,241,0.9)' : 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#fff' }}>
            {i < concluidos ? '✓' : i + 1}
          </div>
          {i < total - 1 && <div style={{ width: 40, height: 2, background: i < concluidos ? '#02A153' : 'rgba(255,255,255,0.15)' }} />}
        </div>
      ))}
    </div>
  )
}
