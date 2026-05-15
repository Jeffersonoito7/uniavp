'use client'
import { useState } from 'react'

type Gestor = { id: string; nome: string; whatsapp: string }

function qrUrl(link: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(link)}&color=333687&bgcolor=ffffff`
}

function LinkCard({
  icon, titulo, desc, link, cor,
}: {
  icon: string; titulo: string; desc: string; link: string; cor: string
}) {
  const [copiado, setCopiado] = useState(false)
  const [verQR, setVerQR] = useState(false)

  function copiar() {
    navigator.clipboard.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  function compartilharWpp() {
    const msg = encodeURIComponent(`📲 *Cadastre-se na plataforma:*\n\n${link}`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <div style={{ background: 'var(--avp-card)', border: `2px solid ${cor}30`, borderRadius: 16, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
        <span style={{ fontSize: 36, flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{titulo}</p>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, lineHeight: 1.5 }}>{desc}</p>
        </div>
      </div>

      {/* URL */}
      <div style={{ background: 'var(--avp-black)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, fontFamily: 'monospace', color: cor, flex: 1, wordBreak: 'break-all' }}>{link}</span>
      </div>

      {/* Botões */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={copiar}
          style={{ flex: 1, minWidth: 120, background: copiado ? '#02A153' : cor, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13, transition: 'background 0.2s' }}>
          {copiado ? '✓ Copiado!' : '📋 Copiar link'}
        </button>
        <a href={link} target="_blank" rel="noreferrer"
          style={{ background: 'var(--avp-border)', color: 'var(--avp-text)', borderRadius: 8, padding: '10px 16px', textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          👁 Ver
        </a>
        <button onClick={compartilharWpp}
          style={{ background: '#25d36620', border: '1px solid #25d36640', color: '#25d366', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          WhatsApp
        </button>
        <button onClick={() => setVerQR(v => !v)}
          style={{ background: 'var(--avp-border)', color: 'var(--avp-text)', borderRadius: 8, padding: '10px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          QR {verQR ? '▲' : '▼'}
        </button>
      </div>

      {verQR && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#fff', padding: 12, borderRadius: 12, display: 'inline-block' }}>
            <img src={qrUrl(link)} alt="QR Code" width={180} height={180} style={{ display: 'block' }} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--avp-text-dim)' }}>Escaneie para acessar o link de cadastro</p>
          <a href={qrUrl(link)} download="qrcode.png"
            style={{ fontSize: 12, color: cor, fontWeight: 600, textDecoration: 'none' }}>
            ⬇ Baixar QR Code
          </a>
        </div>
      )}
    </div>
  )
}

export default function CaptacaoCliente({ gestores, baseUrl }: { gestores: Gestor[]; baseUrl: string }) {
  const [gestorSelecionado, setGestorSelecionado] = useState('')

  const gestor = gestores.find(g => g.id === gestorSelecionado)
  const linkGestor = gestor ? `${baseUrl}/g/${gestor.whatsapp}` : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Explicação */}
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ borderRight: '1px solid var(--avp-border)', paddingRight: 16 }}>
          <p style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>🎯 Funil Completo</p>
          <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', lineHeight: 1.6 }}>Para quem <strong style={{ color: 'var(--avp-text)' }}>não conhece</strong> o negócio. Passa por: pergunta → vídeo de apresentação → segunda pergunta → cadastro.</p>
        </div>
        <div>
          <p style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>⚡ Acesso Direto</p>
          <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', lineHeight: 1.6 }}>Para quem <strong style={{ color: 'var(--avp-text)' }}>já conhece</strong> o negócio. Pula o funil e vai direto ao formulário de cadastro (nome, WhatsApp, e-mail, senha).</p>
        </div>
      </div>

      {/* Link genérico de consultor — Funil completo */}
      <LinkCard
        icon="🎯"
        titulo="Consultor — Funil Completo (geral)"
        desc="Para quem não conhece o negócio. Passa por perguntas + vídeo obrigatório antes de se cadastrar."
        link={`${baseUrl}/captacao`}
        cor="#333687"
      />

      {/* Link genérico direto */}
      <LinkCard
        icon="⚡"
        titulo="Consultor — Acesso Direto (geral)"
        desc="Para quem já conhece. Pula o funil e vai direto ao formulário de cadastro."
        link={`${baseUrl}/captacao?direto=1`}
        cor="#f59e0b"
      />

      {/* Link por gestor específico */}
      <div style={{ background: 'var(--avp-card)', border: '2px solid #02A15330', borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          <span style={{ fontSize: 36 }}>🎯</span>
          <div>
            <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Link por Gestor Específico</p>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, lineHeight: 1.5 }}>
              O consultor já é vinculado automaticamente ao gestor correto — sem precisar digitar nada.
            </p>
          </div>
        </div>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--avp-text-dim)', marginBottom: 8 }}>
          Selecione o gestor:
        </label>
        <select
          value={gestorSelecionado}
          onChange={e => setGestorSelecionado(e.target.value)}
          style={{ width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', marginBottom: 16, cursor: 'pointer' }}>
          <option value="">— Escolha um gestor —</option>
          {gestores.map(g => (
            <option key={g.id} value={g.id}>{g.nome} ({g.whatsapp})</option>
          ))}
        </select>

        {gestor && linkGestor && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <LinkCard
              icon="🎯"
              titulo={`Funil Completo — ${gestor.nome}`}
              desc={`Para quem não conhece. Passa por perguntas + vídeo + cadastro, vinculado a ${gestor.nome}.`}
              link={linkGestor}
              cor="#02A153"
            />
            <LinkCard
              icon="⚡"
              titulo={`Acesso Direto — ${gestor.nome}`}
              desc={`Para quem já conhece. Vai direto ao cadastro, vinculado a ${gestor.nome}.`}
              link={`${linkGestor}?direto=1`}
              cor="#f59e0b"
            />
          </div>
        )}

        {!gestorSelecionado && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--avp-text-dim)', fontSize: 13 }}>
            Selecione um gestor acima para gerar o link personalizado
          </div>
        )}
      </div>

      {/* Link de gestor */}
      <LinkCard
        icon="👔"
        titulo="Cadastro de Gestor"
        desc="Envie para quem vai ser gestor da equipe. O cadastro fica pendente até você ativar no painel Gestores."
        link={`${baseUrl}/convite/gestor`}
        cor="#6366f1"
      />

      {/* Dica */}
      <div style={{ background: '#02A15310', border: '1px solid #02A15330', borderRadius: 12, padding: 18, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>💡</span>
        <div style={{ fontSize: 13, color: 'var(--avp-text-dim)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--avp-text)' }}>Dica:</strong> Use o <strong style={{ color: 'var(--avp-text)' }}>Link por Gestor Específico</strong> sempre que possível.
          O consultor chega direto na apresentação do gestor e já fica vinculado automaticamente —
          sem erros de digitação no cadastro.
        </div>
      </div>
    </div>
  )
}
