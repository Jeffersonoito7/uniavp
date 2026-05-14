'use client'
import { useState } from 'react'
import CertificadoPopup from './CertificadoPopup'
import CarteiraPopup from './CarteiraPopup'

type Props = {
  nomeAluno: string
  templateUrl: string
  whatsapp?: string
  numRegistro?: string
}

type Etapa = 'certificado' | 'carteira' | 'fechado'

function jaViu(whatsapp: string) {
  try { return !!localStorage.getItem(`formatura_vista_${whatsapp}`) } catch { return false }
}

function marcarVisto(whatsapp: string) {
  try { localStorage.setItem(`formatura_vista_${whatsapp}`, '1') } catch { /* */ }
}

export default function CertificadoWrapper({ nomeAluno, templateUrl, whatsapp, numRegistro }: Props) {
  const chave = whatsapp ?? 'aluno'
  const [etapa, setEtapa] = useState<Etapa>(() => jaViu(chave) ? 'fechado' : 'certificado')

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
