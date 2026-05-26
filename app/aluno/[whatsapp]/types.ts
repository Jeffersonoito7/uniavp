export type TrilhaItem = {
  modulo_id: string
  modulo_ordem: number
  modulo_titulo: string
  aula_id: string
  aula_ordem: number
  aula_titulo: string
  aula_descricao: string | null
  duracao_minutos: number | null
  capa_url: string | null
  youtube_video_id: string | null
  status: string
  melhor_percentual: number | null
  liberada_em: string | null
  validade_meses?: number | null
  progresso_created_at?: string | null
  quiz_aprovacao_minima?: number | null
}

export type ModuloComAulas = {
  modulo_id: string
  modulo_titulo: string
  modulo_ordem: number
  aulas: TrilhaItem[]
  apenasProPermissao: boolean
}
