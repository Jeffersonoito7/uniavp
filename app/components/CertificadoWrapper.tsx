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

export default function CertificadoWrapper({ nomeAluno, templateUrl, whatsapp, numRegistro }: Props) {
  const [etapa, setEtapa] = useState<Etapa>('certificado')

  if (etapa === 'fechado') return null

  if (etapa === 'certificado') {
    return (
      <CertificadoPopup
        nomeAluno={nomeAluno}
        templateUrl={templateUrl}
        onClose={() => setEtapa(whatsapp && numRegistro ? 'carteira' : 'fechado')}
      />
    )
  }

  if (etapa === 'carteira' && whatsapp && numRegistro) {
    return (
      <CarteiraPopup
        nomeAluno={nomeAluno}
        numRegistro={numRegistro}
        whatsapp={whatsapp}
        onClose={() => setEtapa('fechado')}
      />
    )
  }

  return null
}
