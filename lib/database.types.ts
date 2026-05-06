export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Indicador {
  id: string; nome: string; tipo: 'gestor' | 'consultor';
  whatsapp: string; email: string | null; ativo: boolean;
  created_at: string; updated_at: string;
}

export interface Aluno {
  id: string; user_id: string | null; nome: string; whatsapp: string; email: string;
  indicador_id: string | null;
  status: 'ativo' | 'pausado' | 'concluido' | 'desligado';
  data_conclusao: string | null; whatsapp_validado: boolean;
  foto_url: string | null; bio: string | null;
  created_at: string; updated_at: string;
}

export interface Modulo {
  id: string; ordem: number; titulo: string; descricao: string | null;
  capa_url: string | null; publicado: boolean;
  created_at: string; updated_at: string;
}

export interface Aula {
  id: string; modulo_id: string; ordem: number; titulo: string;
  descricao: string | null; youtube_video_id: string;
  duracao_minutos: number | null; capa_url: string | null;
  quiz_qtd_questoes: number; quiz_aprovacao_minima: number;
  quiz_max_tentativas: number | null; espera_horas: number;
  publicado: boolean; created_at: string; updated_at: string;
}

export interface Alternativa { letra: string; texto: string; correta: boolean; }

export interface Questao {
  id: string; aula_id: string; ordem: number; enunciado: string;
  alternativas: Alternativa[]; explicacao: string | null; ativa: boolean;
  created_at: string; updated_at: string;
}

export interface Progresso {
  id: string; aluno_id: string; aula_id: string; tentativa_numero: number;
  acertos: number; total_questoes: number; percentual: number; aprovado: boolean;
  respostas: Json | null; proxima_aula_liberada_em: string | null;
  whatsapp_notificado: boolean; whatsapp_notificado_em: string | null;
  created_at: string;
}

export interface Admin {
  id: string; user_id: string; nome: string; email: string;
  role: 'admin' | 'super_admin'; ativo: boolean; created_at: string;
}

export type StatusAula = 'concluida' | 'disponivel' | 'aguardando_tempo' | 'bloqueada';

export interface TrilhaItem {
  modulo_id: string; modulo_ordem: number; modulo_titulo: string;
  aula_id: string; aula_ordem: number; aula_titulo: string;
  aula_descricao: string | null; duracao_minutos: number | null;
  capa_url: string | null; youtube_video_id: string;
  status: StatusAula; melhor_percentual: number | null;
  liberada_em: string | null; publicado: boolean;
}

type NoRelationships = { Relationships: [] };

export interface Database {
  public: {
    Tables: {
      indicadores: { Row: Indicador; Insert: Partial<Indicador>; Update: Partial<Indicador> } & NoRelationships;
      alunos:      { Row: Aluno;      Insert: Partial<Aluno>;      Update: Partial<Aluno> } & NoRelationships;
      modulos:     { Row: Modulo;     Insert: Partial<Modulo>;     Update: Partial<Modulo> } & NoRelationships;
      aulas:       { Row: Aula;       Insert: Partial<Aula>;       Update: Partial<Aula> } & NoRelationships;
      questoes:    { Row: Questao;    Insert: Partial<Questao>;    Update: Partial<Questao> } & NoRelationships;
      progresso:   { Row: Progresso;  Insert: Partial<Progresso>;  Update: Partial<Progresso> } & NoRelationships;
      admins:      { Row: Admin;      Insert: Partial<Admin>;      Update: Partial<Admin> } & NoRelationships;
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: unknown[];
      };
    };
    Functions: {
      obter_trilha_aluno: { Args: { p_aluno_id: string }; Returns: TrilhaItem[] };
      is_admin:           { Args: { check_user_id: string }; Returns: boolean };
    };
    Enums: { [key: string]: string };
    CompositeTypes: { [key: string]: unknown };
  };
}
