import CarteiraDisplay from '@/app/aluno/[whatsapp]/carteira/CarteiraDisplay'

export default function TesteCarteira() {
  return (
    <CarteiraDisplay
      nome="Jefferson Soares"
      numRegistro="001001"
      fotoUrl={null}
      dataFormacao="13/05/2025"
      validade="13/05/2027"
      cargaHoraria="8h 30min"
      turma="2025"
      whatsapp="5500000000000"
      status="concluido"
      empresaNome="AUTOVALE PREVENÇÕES"
      empresaLogoUrl={null}
      assinaturaNome="Albueno"
      assinaturaCargo="PRESIDENTE"
      assinaturaEmpresa="AUTOVALE PREVENÇÕES"
      urlVerificacao="uniavp.autovaleprevencoes.org.br"
      tagline="PROTEÇÃO VEICULAR DE VERDADE!"
      logoEsquerdaUrl={null}
      logoDireitaUrl={null}
    />
  )
}
