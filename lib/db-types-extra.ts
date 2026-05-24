/**
 * Tipos para tabelas criadas depois da última geração automática do database.types.ts.
 * Após rodar `supabase gen types typescript`, mova esses tipos para database.types.ts
 * e remova este arquivo.
 */

export type AulaAoVivo = {
  id: string
  titulo: string
  descricao: string | null
  plataforma: 'zoom' | 'meet'
  link: string
  data_hora: string
  duracao_minutos: number
  obrigatoria: boolean
  lembrete_enviado: boolean
  gravacao_url: string | null
  gestor_id: string | null
  tenant_id: string | null
  created_at: string
}

export type AulaAoVivoInsert = Omit<AulaAoVivo, 'id' | 'created_at' | 'lembrete_enviado'> & {
  id?: string
  lembrete_enviado?: boolean
}

export type AulaAoVivoUpdate = Partial<AulaAoVivoInsert>
