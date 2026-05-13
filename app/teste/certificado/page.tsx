import CertificadoWrapper from '@/app/components/CertificadoWrapper'

export default function TesteCertificado() {
  return (
    <div style={{ minHeight: '100vh', background: '#08090d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CertificadoWrapper
        nomeAluno="Jefferson Soares"
        templateUrl=""
        nomeX={50}
        nomeY={62}
        nomeTamanho={72}
        nomeCor="#1a1a2e"
        cidade="São Paulo"
        dataX={50}
        dataY={72}
        dataTamanho={36}
        dataCor="#1a1a2e"
      />
    </div>
  )
}
