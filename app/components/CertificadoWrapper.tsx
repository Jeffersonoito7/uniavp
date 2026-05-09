'use client'
import { useState } from 'react'
import CertificadoPopup from './CertificadoPopup'

type Props = {
  nomeAluno: string
  templateUrl: string
  nomeX: number
  nomeY: number
  nomeTamanho: number
  nomeCor: string
}

export default function CertificadoWrapper(props: Props) {
  const [aberto, setAberto] = useState(true)
  if (!aberto) return null
  return <CertificadoPopup {...props} onClose={() => setAberto(false)} />
}
