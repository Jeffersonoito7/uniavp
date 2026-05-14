'use client'
import { useState, useEffect } from 'react'
import CertificadoPopup from './CertificadoPopup'
import CarteiraPopup from './CarteiraPopup'

type Props = {
  nomeAluno: string
  templateUrl: string
  whatsapp?: string
  numRegistro?: string
  nomeY?: number
  nomeFontePct?: number
  nomeCor?: string
}

type Etapa = 'certificado' | 'carteira' | 'fechado'

function jaViu(whatsapp: string) {
  try { return !!localStorage.getItem(`formatura_vista_${whatsapp}`) } catch { return false }
}

function marcarVisto(whatsapp: string) {
  try { localStorage.setItem(`formatura_vista_${whatsapp}`, '1') } catch { /* */ }
}

export default function CertificadoWrapper({ nomeAluno, templateUrl, whatsapp, numRegistro, nomeY, nomeFontePct, nomeCor }: Props) {
  const chave = whatsapp ?? 'aluno'
  const [etapa, setEtapa] = useState<Etapa>(() => jaViu(chave) ? 'fechado' : 'certificado')

  useEffect(() => {
    if (etapa !== 'certificado') return
    try {
      const ctx = new AudioContext()
      // Gera 3 segundos de ruído branco suave (simulação de palmas)
      function palma(quando: number) {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.18, ctx.sampleRate)
        const data = buf.getChannelData(0)
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.5)
        }
        const src = ctx.createBufferSource()
        src.buffer = buf
        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0.35, quando)
        gain.gain.exponentialRampToValueAtTime(0.001, quando + 0.18)
        src.connect(gain)
        gain.connect(ctx.destination)
        src.start(quando)
      }
      // Sequência rítmica de palmas
      const batidas = [0, 0.22, 0.44, 0.62, 0.80, 0.95, 1.10, 1.22, 1.34, 1.44, 1.54, 1.63, 1.72, 1.80, 1.87]
      batidas.forEach(t => palma(ctx.currentTime + t))
    } catch { /* AudioContext não disponível */ }
  }, [etapa])

  function fecharCertificado() {
    const proxima = whatsapp && numRegistro ? 'carteira' : 'fechado'
    if (proxima === 'fechado') marcarVisto(chave)
    setEtapa(proxima)
  }

  function fecharCarteira() {
    marcarVisto(chave)
    setEtapa('fechado')
  }

  if (etapa === 'fechado') return null

  if (etapa === 'certificado') {
    return (
      <CertificadoPopup
        nomeAluno={nomeAluno}
        templateUrl={templateUrl}
        nomeY={nomeY}
        nomeFontePct={nomeFontePct}
        nomeCor={nomeCor}
        onClose={fecharCertificado}
      />
    )
  }

  if (etapa === 'carteira' && whatsapp && numRegistro) {
    return (
      <CarteiraPopup
        nomeAluno={nomeAluno}
        numRegistro={numRegistro}
        whatsapp={whatsapp}
        onClose={fecharCarteira}
      />
    )
  }

  return null
}
