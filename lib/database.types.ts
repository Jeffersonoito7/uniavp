export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          email: string
          id: string
          nome: string
          role: string
          tenant_id: string | null
          user_id: string
          whatsapp: string | null
          whatsapp_instancia: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          nome: string
          role?: string
          tenant_id?: string | null
          user_id: string
          whatsapp?: string | null
          whatsapp_instancia?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          role?: string
          tenant_id?: string | null
          user_id?: string
          whatsapp?: string | null
          whatsapp_instancia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admins_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      aluno_medalhas: {
        Row: {
          aluno_id: string
          earned_at: string | null
          id: string
          medalha_id: string
        }
        Insert: {
          aluno_id: string
          earned_at?: string | null
          id?: string
          medalha_id: string
        }
        Update: {
          aluno_id?: string
          earned_at?: string | null
          id?: string
          medalha_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aluno_medalhas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aluno_medalhas_medalha_id_fkey"
            columns: ["medalha_id"]
            isOneToOne: false
            referencedRelation: "medalhas_config"
            referencedColumns: ["id"]
          },
        ]
      }
      aluno_pontos: {
        Row: {
          aluno_id: string
          created_at: string | null
          id: string
          motivo: string | null
          quantidade: number
        }
        Insert: {
          aluno_id: string
          created_at?: string | null
          id?: string
          motivo?: string | null
          quantidade: number
        }
        Update: {
          aluno_id?: string
          created_at?: string | null
          id?: string
          motivo?: string | null
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "aluno_pontos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      alunos: {
        Row: {
          bio: string | null
          cpf: string | null
          created_at: string | null
          data_conclusao: string | null
          data_formacao: string | null
          email: string
          foto_perfil: string | null
          foto_url: string | null
          gestor_nome: string | null
          gestor_whatsapp: string | null
          id: string
          indicador_id: string | null
          link_externo: string | null
          maior_streak: number | null
          nome: string
          numero_registro: number | null
          setup_concluido: boolean | null
          status: string
          streak_atual: number | null
          tenant_id: string | null
          ultimo_estudo_em: string | null
          updated_at: string | null
          user_id: string | null
          whatsapp: string
          whatsapp_validado: boolean | null
        }
        Insert: {
          bio?: string | null
          cpf?: string | null
          created_at?: string | null
          data_conclusao?: string | null
          data_formacao?: string | null
          email: string
          foto_perfil?: string | null
          foto_url?: string | null
          gestor_nome?: string | null
          gestor_whatsapp?: string | null
          id?: string
          indicador_id?: string | null
          link_externo?: string | null
          maior_streak?: number | null
          nome: string
          numero_registro?: number | null
          setup_concluido?: boolean | null
          status?: string
          streak_atual?: number | null
          tenant_id?: string | null
          ultimo_estudo_em?: string | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp: string
          whatsapp_validado?: boolean | null
        }
        Update: {
          bio?: string | null
          cpf?: string | null
          created_at?: string | null
          data_conclusao?: string | null
          data_formacao?: string | null
          email?: string
          foto_perfil?: string | null
          foto_url?: string | null
          gestor_nome?: string | null
          gestor_whatsapp?: string | null
          id?: string
          indicador_id?: string | null
          link_externo?: string | null
          maior_streak?: number | null
          nome?: string
          numero_registro?: number | null
          setup_concluido?: boolean | null
          status?: string
          streak_atual?: number | null
          tenant_id?: string | null
          ultimo_estudo_em?: string | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp?: string
          whatsapp_validado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "alunos_indicador_id_fkey"
            columns: ["indicador_id"]
            isOneToOne: false
            referencedRelation: "indicadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alunos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      artes_templates: {
        Row: {
          arte_url: string | null
          ativo: boolean | null
          created_at: string | null
          formato: string | null
          foto_altura: number | null
          foto_largura: number | null
          foto_redondo: boolean | null
          foto_x: number | null
          foto_y: number | null
          gestor_id: string | null
          id: string
          tenant_id: string | null
          texto_alinhamento: string | null
          texto_ativo: boolean | null
          texto_cor: string | null
          texto_fonte: string | null
          texto_negrito: boolean | null
          texto_sombra: boolean | null
          texto_tamanho: number | null
          texto_template: string | null
          texto_x: number | null
          texto_y: number | null
          tipo: string
          titulo: string
        }
        Insert: {
          arte_url?: string | null
          ativo?: boolean | null
          created_at?: string | null
          formato?: string | null
          foto_altura?: number | null
          foto_largura?: number | null
          foto_redondo?: boolean | null
          foto_x?: number | null
          foto_y?: number | null
          gestor_id?: string | null
          id?: string
          tenant_id?: string | null
          texto_alinhamento?: string | null
          texto_ativo?: boolean | null
          texto_cor?: string | null
          texto_fonte?: string | null
          texto_negrito?: boolean | null
          texto_sombra?: boolean | null
          texto_tamanho?: number | null
          texto_template?: string | null
          texto_x?: number | null
          texto_y?: number | null
          tipo: string
          titulo: string
        }
        Update: {
          arte_url?: string | null
          ativo?: boolean | null
          created_at?: string | null
          formato?: string | null
          foto_altura?: number | null
          foto_largura?: number | null
          foto_redondo?: boolean | null
          foto_x?: number | null
          foto_y?: number | null
          gestor_id?: string | null
          id?: string
          tenant_id?: string | null
          texto_alinhamento?: string | null
          texto_ativo?: boolean | null
          texto_cor?: string | null
          texto_fonte?: string | null
          texto_negrito?: boolean | null
          texto_sombra?: boolean | null
          texto_tamanho?: number | null
          texto_template?: string | null
          texto_x?: number | null
          texto_y?: number | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "artes_templates_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "gestores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artes_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      aula_arquivos: {
        Row: {
          aula_id: string
          created_at: string | null
          id: string
          nome: string
          url: string
        }
        Insert: {
          aula_id: string
          created_at?: string | null
          id?: string
          nome: string
          url: string
        }
        Update: {
          aula_id?: string
          created_at?: string | null
          id?: string
          nome?: string
          url?: string
        }
        Relationships: []
      }
      aula_avaliacoes: {
        Row: {
          aluno_id: string
          aula_id: string
          created_at: string | null
          estrelas: number
          id: string
          sugestao: string | null
        }
        Insert: {
          aluno_id: string
          aula_id: string
          created_at?: string | null
          estrelas: number
          id?: string
          sugestao?: string | null
        }
        Update: {
          aluno_id?: string
          aula_id?: string
          created_at?: string | null
          estrelas?: number
          id?: string
          sugestao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aula_avaliacoes_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aula_avaliacoes_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      aula_curtidas: {
        Row: {
          aluno_id: string
          aula_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          aluno_id: string
          aula_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          aluno_id?: string
          aula_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      aulas: {
        Row: {
          ao_vivo_data: string | null
          ao_vivo_link: string | null
          ao_vivo_plataforma: string | null
          bloquear_avancar: boolean | null
          bloquear_link_externo: boolean | null
          bloquear_links_app: boolean | null
          capa_url: string | null
          created_at: string | null
          descricao: string | null
          duracao_minutos: number | null
          espera_horas: number
          id: string
          liberacao_modo: string
          link_externo_titulo: string | null
          modulo_id: string
          mostrar_link_externo: boolean | null
          mostrar_links_app: boolean | null
          ordem: number
          publicado: boolean | null
          quiz_aprovacao_minima: number
          quiz_max_tentativas: number | null
          quiz_qtd_questoes: number
          quiz_sim_nao_nao_mensagem: string | null
          quiz_sim_nao_pergunta: string | null
          quiz_sim_nao_perguntas: Json | null
          quiz_tipo: string | null
          tenant_id: string | null
          titulo: string
          updated_at: string | null
          validade_meses: number | null
          video_url: string | null
          youtube_video_id: string
        }
        Insert: {
          ao_vivo_data?: string | null
          ao_vivo_link?: string | null
          ao_vivo_plataforma?: string | null
          bloquear_avancar?: boolean | null
          bloquear_link_externo?: boolean | null
          bloquear_links_app?: boolean | null
          capa_url?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao_minutos?: number | null
          espera_horas?: number
          id?: string
          liberacao_modo?: string
          link_externo_titulo?: string | null
          modulo_id: string
          mostrar_link_externo?: boolean | null
          mostrar_links_app?: boolean | null
          ordem: number
          publicado?: boolean | null
          quiz_aprovacao_minima?: number
          quiz_max_tentativas?: number | null
          quiz_qtd_questoes?: number
          quiz_sim_nao_nao_mensagem?: string | null
          quiz_sim_nao_pergunta?: string | null
          quiz_sim_nao_perguntas?: Json | null
          quiz_tipo?: string | null
          tenant_id?: string | null
          titulo: string
          updated_at?: string | null
          validade_meses?: number | null
          video_url?: string | null
          youtube_video_id: string
        }
        Update: {
          ao_vivo_data?: string | null
          ao_vivo_link?: string | null
          ao_vivo_plataforma?: string | null
          bloquear_avancar?: boolean | null
          bloquear_link_externo?: boolean | null
          bloquear_links_app?: boolean | null
          capa_url?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao_minutos?: number | null
          espera_horas?: number
          id?: string
          liberacao_modo?: string
          link_externo_titulo?: string | null
          modulo_id?: string
          mostrar_link_externo?: boolean | null
          mostrar_links_app?: boolean | null
          ordem?: number
          publicado?: boolean | null
          quiz_aprovacao_minima?: number
          quiz_max_tentativas?: number | null
          quiz_qtd_questoes?: number
          quiz_sim_nao_nao_mensagem?: string | null
          quiz_sim_nao_pergunta?: string | null
          quiz_sim_nao_perguntas?: Json | null
          quiz_tipo?: string | null
          tenant_id?: string | null
          titulo?: string
          updated_at?: string | null
          validade_meses?: number | null
          video_url?: string | null
          youtube_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aulas_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      aulas_ao_vivo: {
        Row: {
          created_at: string | null
          criado_por: string
          data_hora: string
          descricao: string | null
          duracao_minutos: number | null
          gestor_id: string | null
          gravacao_url: string | null
          id: string
          lembrete_enviado: boolean | null
          link: string
          obrigatoria: boolean | null
          plataforma: string
          titulo: string
        }
        Insert: {
          created_at?: string | null
          criado_por?: string
          data_hora: string
          descricao?: string | null
          duracao_minutos?: number | null
          gestor_id?: string | null
          gravacao_url?: string | null
          id?: string
          lembrete_enviado?: boolean | null
          link: string
          obrigatoria?: boolean | null
          plataforma: string
          titulo: string
        }
        Update: {
          created_at?: string | null
          criado_por?: string
          data_hora?: string
          descricao?: string | null
          duracao_minutos?: number | null
          gestor_id?: string | null
          gravacao_url?: string | null
          id?: string
          lembrete_enviado?: boolean | null
          link?: string
          obrigatoria?: boolean | null
          plataforma?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "aulas_ao_vivo_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "gestores"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          ativo: boolean | null
          contato_email: string | null
          contato_nome: string | null
          contato_whatsapp: string | null
          cpf_cnpj: string | null
          created_at: string | null
          dominio: string | null
          gestor_ativo: boolean | null
          id: string
          limite_consultores: number | null
          mensalidade: number | null
          nome: string
          observacoes: string | null
          pix_txid: string | null
          plano: string | null
          status_pagamento: string | null
          tipo: string | null
          ultimo_pagamento: string | null
          vencimento_dia: number | null
        }
        Insert: {
          ativo?: boolean | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_whatsapp?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          dominio?: string | null
          gestor_ativo?: boolean | null
          id?: string
          limite_consultores?: number | null
          mensalidade?: number | null
          nome: string
          observacoes?: string | null
          pix_txid?: string | null
          plano?: string | null
          status_pagamento?: string | null
          tipo?: string | null
          ultimo_pagamento?: string | null
          vencimento_dia?: number | null
        }
        Update: {
          ativo?: boolean | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_whatsapp?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          dominio?: string | null
          gestor_ativo?: boolean | null
          id?: string
          limite_consultores?: number | null
          mensalidade?: number | null
          nome?: string
          observacoes?: string | null
          pix_txid?: string | null
          plano?: string | null
          status_pagamento?: string | null
          tipo?: string | null
          ultimo_pagamento?: string | null
          vencimento_dia?: number | null
        }
        Relationships: []
      }
      cncpv_assinaturas: {
        Row: {
          aluno_id: string | null
          assinado_em: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          hash_contrato: string | null
          id: string
          ip: string | null
          nome: string
          numero_registro: string | null
          pdf_status: string | null
          pdf_url: string | null
          revogado_em: string | null
          revogado_motivo: string | null
          status: string | null
          termos_aceitos: Json | null
          whatsapp: string | null
        }
        Insert: {
          aluno_id?: string | null
          assinado_em?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          hash_contrato?: string | null
          id?: string
          ip?: string | null
          nome: string
          numero_registro?: string | null
          pdf_status?: string | null
          pdf_url?: string | null
          revogado_em?: string | null
          revogado_motivo?: string | null
          status?: string | null
          termos_aceitos?: Json | null
          whatsapp?: string | null
        }
        Update: {
          aluno_id?: string | null
          assinado_em?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          hash_contrato?: string | null
          id?: string
          ip?: string | null
          nome?: string
          numero_registro?: string | null
          pdf_status?: string | null
          pdf_url?: string | null
          revogado_em?: string | null
          revogado_motivo?: string | null
          status?: string | null
          termos_aceitos?: Json | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cncpv_assinaturas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      cobrancas: {
        Row: {
          cliente_id: string | null
          codigo_barras: string | null
          created_at: string | null
          id: string
          pago_em: string | null
          pdf_url: string | null
          pix_copia_cola: string | null
          qrcode_base64: string | null
          status: string | null
          tipo: string | null
          txid: string | null
          valor: number
          vencimento: string
        }
        Insert: {
          cliente_id?: string | null
          codigo_barras?: string | null
          created_at?: string | null
          id?: string
          pago_em?: string | null
          pdf_url?: string | null
          pix_copia_cola?: string | null
          qrcode_base64?: string | null
          status?: string | null
          tipo?: string | null
          txid?: string | null
          valor: number
          vencimento: string
        }
        Update: {
          cliente_id?: string | null
          codigo_barras?: string | null
          created_at?: string | null
          id?: string
          pago_em?: string | null
          pdf_url?: string | null
          pix_copia_cola?: string | null
          qrcode_base64?: string | null
          status?: string | null
          tipo?: string | null
          txid?: string | null
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "cobrancas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios: {
        Row: {
          aluno_id: string | null
          aula_id: string
          created_at: string | null
          id: string
          parent_id: string | null
          texto: string
        }
        Insert: {
          aluno_id?: string | null
          aula_id: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          texto: string
        }
        Update: {
          aluno_id?: string | null
          aula_id?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          chave: string
          descricao: string | null
          tenant_id: string | null
          updated_at: string | null
          valor: Json
        }
        Insert: {
          chave: string
          descricao?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          valor: Json
        }
        Update: {
          chave?: string
          descricao?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          valor?: Json
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          aluno_id: string | null
          assinado_em: string | null
          clausulas_aceitas: Json | null
          cnpj_mei: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          hash_contrato: string | null
          id: string
          ip: string | null
          nome: string
          numero_registro: string | null
          pdf_status: string | null
          pdf_url: string | null
          sede_mei: string | null
          tenant_id: string | null
          whatsapp: string
        }
        Insert: {
          aluno_id?: string | null
          assinado_em?: string | null
          clausulas_aceitas?: Json | null
          cnpj_mei?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          hash_contrato?: string | null
          id?: string
          ip?: string | null
          nome: string
          numero_registro?: string | null
          pdf_status?: string | null
          pdf_url?: string | null
          sede_mei?: string | null
          tenant_id?: string | null
          whatsapp: string
        }
        Update: {
          aluno_id?: string | null
          assinado_em?: string | null
          clausulas_aceitas?: Json | null
          cnpj_mei?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          hash_contrato?: string | null
          id?: string
          ip?: string | null
          nome?: string
          numero_registro?: string | null
          pdf_status?: string | null
          pdf_url?: string | null
          sede_mei?: string | null
          tenant_id?: string | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "contratos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_painel: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          ordem: number | null
          painel: string
          pdf_url: string
          titulo: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          ordem?: number | null
          painel?: string
          pdf_url: string
          titulo: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          ordem?: number | null
          painel?: string
          pdf_url?: string
          titulo?: string
        }
        Relationships: []
      }
      eventos: {
        Row: {
          cidade: string | null
          created_at: string | null
          data_hora: string
          descricao: string | null
          gestor_id: string | null
          id: string
          imagem_url: string | null
          titulo: string
        }
        Insert: {
          cidade?: string | null
          created_at?: string | null
          data_hora: string
          descricao?: string | null
          gestor_id?: string | null
          id?: string
          imagem_url?: string | null
          titulo: string
        }
        Update: {
          cidade?: string | null
          created_at?: string | null
          data_hora?: string
          descricao?: string | null
          gestor_id?: string | null
          id?: string
          imagem_url?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "gestores"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_respostas: {
        Row: {
          aluno_id: string | null
          created_at: string | null
          id: string
          texto: string
          topico_id: string
        }
        Insert: {
          aluno_id?: string | null
          created_at?: string | null
          id?: string
          texto: string
          topico_id: string
        }
        Update: {
          aluno_id?: string | null
          created_at?: string | null
          id?: string
          texto?: string
          topico_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_respostas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_respostas_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "forum_topicos"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topicos: {
        Row: {
          aluno_id: string | null
          created_at: string | null
          descricao: string | null
          fixado: boolean | null
          id: string
          titulo: string
        }
        Insert: {
          aluno_id?: string | null
          created_at?: string | null
          descricao?: string | null
          fixado?: boolean | null
          id?: string
          titulo: string
        }
        Update: {
          aluno_id?: string | null
          created_at?: string | null
          descricao?: string | null
          fixado?: boolean | null
          id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_topicos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      gestor_pagamentos: {
        Row: {
          created_at: string | null
          gestor_id: string
          id: string
          pago_em: string | null
          pix_copia_cola: string | null
          qrcode_base64: string | null
          status: string
          tenant_id: string | null
          txid: string
          valor: number
          vencimento: string | null
        }
        Insert: {
          created_at?: string | null
          gestor_id: string
          id?: string
          pago_em?: string | null
          pix_copia_cola?: string | null
          qrcode_base64?: string | null
          status?: string
          tenant_id?: string | null
          txid: string
          valor?: number
          vencimento?: string | null
        }
        Update: {
          created_at?: string | null
          gestor_id?: string
          id?: string
          pago_em?: string | null
          pix_copia_cola?: string | null
          qrcode_base64?: string | null
          status?: string
          tenant_id?: string | null
          txid?: string
          valor?: number
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gestor_pagamentos_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "gestores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gestor_pagamentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      gestor_registros: {
        Row: {
          created_at: string | null
          data_referencia: string | null
          descricao: string | null
          gestor_id: string | null
          id: string
          quantidade: number | null
          tipo: string
          valor: number | null
        }
        Insert: {
          created_at?: string | null
          data_referencia?: string | null
          descricao?: string | null
          gestor_id?: string | null
          id?: string
          quantidade?: number | null
          tipo: string
          valor?: number | null
        }
        Update: {
          created_at?: string | null
          data_referencia?: string | null
          descricao?: string | null
          gestor_id?: string | null
          id?: string
          quantidade?: number | null
          tipo?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gestor_registros_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "gestores"
            referencedColumns: ["id"]
          },
        ]
      }
      gestores: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          email: string
          foto_perfil: string | null
          id: string
          indicado_por_gestor_id: string | null
          link_externo: string | null
          nome: string
          pix_txid: string | null
          plano_vencimento: string | null
          status_assinatura: string | null
          tenant_id: string | null
          trial_expira_em: string | null
          user_id: string | null
          whatsapp: string
          whatsapp_instancia: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email: string
          foto_perfil?: string | null
          id?: string
          indicado_por_gestor_id?: string | null
          link_externo?: string | null
          nome: string
          pix_txid?: string | null
          plano_vencimento?: string | null
          status_assinatura?: string | null
          tenant_id?: string | null
          trial_expira_em?: string | null
          user_id?: string | null
          whatsapp: string
          whatsapp_instancia?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string
          foto_perfil?: string | null
          id?: string
          indicado_por_gestor_id?: string | null
          link_externo?: string | null
          nome?: string
          pix_txid?: string | null
          plano_vencimento?: string | null
          status_assinatura?: string | null
          tenant_id?: string | null
          trial_expira_em?: string | null
          user_id?: string | null
          whatsapp?: string
          whatsapp_instancia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gestores_indicado_por_gestor_id_fkey"
            columns: ["indicado_por_gestor_id"]
            isOneToOne: false
            referencedRelation: "gestores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gestores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      indicadores: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          email: string | null
          id: string
          nome: string
          tenant_id: string | null
          tipo: string
          updated_at: string | null
          whatsapp: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome: string
          tenant_id?: string | null
          tipo: string
          updated_at?: string | null
          whatsapp: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          tenant_id?: string | null
          tipo?: string
          updated_at?: string | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "indicadores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      medalhas_config: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          tipo: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          tipo: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          tipo?: string
        }
        Relationships: []
      }
      modulos: {
        Row: {
          capa_url: string | null
          cert_assinatura_cargo: string | null
          cert_assinatura_nome: string | null
          cert_assinatura_url: string | null
          cert_assinatura_y: number | null
          cert_ativo: boolean | null
          cert_logo_dir_url: string | null
          cert_logo_esq_url: string | null
          cert_logo_tam: number | null
          cert_logo_y: number | null
          cert_nome_cor: string | null
          cert_nome_estilo: string | null
          cert_nome_tamanho: number | null
          cert_nome_y: number | null
          cert_template_url: string | null
          created_at: string | null
          descricao: string | null
          id: string
          ordem: number
          perfis_permitidos: string[] | null
          publicado: boolean | null
          tenant_id: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          capa_url?: string | null
          cert_assinatura_cargo?: string | null
          cert_assinatura_nome?: string | null
          cert_assinatura_url?: string | null
          cert_assinatura_y?: number | null
          cert_ativo?: boolean | null
          cert_logo_dir_url?: string | null
          cert_logo_esq_url?: string | null
          cert_logo_tam?: number | null
          cert_logo_y?: number | null
          cert_nome_cor?: string | null
          cert_nome_estilo?: string | null
          cert_nome_tamanho?: number | null
          cert_nome_y?: number | null
          cert_template_url?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          ordem: number
          perfis_permitidos?: string[] | null
          publicado?: boolean | null
          tenant_id?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          capa_url?: string | null
          cert_assinatura_cargo?: string | null
          cert_assinatura_nome?: string | null
          cert_assinatura_url?: string | null
          cert_assinatura_y?: number | null
          cert_ativo?: boolean | null
          cert_logo_dir_url?: string | null
          cert_logo_esq_url?: string | null
          cert_logo_tam?: number | null
          cert_logo_y?: number | null
          cert_nome_cor?: string | null
          cert_nome_estilo?: string | null
          cert_nome_tamanho?: number | null
          cert_nome_y?: number | null
          cert_template_url?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          ordem?: number
          perfis_permitidos?: string[] | null
          publicado?: boolean | null
          tenant_id?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modulos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      noticias: {
        Row: {
          conteudo: string | null
          created_at: string | null
          id: string
          imagem_url: string | null
          publicado: boolean | null
          titulo: string
        }
        Insert: {
          conteudo?: string | null
          created_at?: string | null
          id?: string
          imagem_url?: string | null
          publicado?: boolean | null
          titulo: string
        }
        Update: {
          conteudo?: string | null
          created_at?: string | null
          id?: string
          imagem_url?: string | null
          publicado?: boolean | null
          titulo?: string
        }
        Relationships: []
      }
      otp_whatsapp: {
        Row: {
          codigo: string
          created_at: string | null
          expira_em: string
          id: string
          usado: boolean | null
          whatsapp: string
        }
        Insert: {
          codigo: string
          created_at?: string | null
          expira_em: string
          id?: string
          usado?: boolean | null
          whatsapp: string
        }
        Update: {
          codigo?: string
          created_at?: string | null
          expira_em?: string
          id?: string
          usado?: boolean | null
          whatsapp?: string
        }
        Relationships: []
      }
      premios: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          custo_pontos: number
          descricao: string | null
          id: string
          nome: string
          quantidade_disponivel: number | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          custo_pontos?: number
          descricao?: string | null
          id?: string
          nome: string
          quantidade_disponivel?: number | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          custo_pontos?: number
          descricao?: string | null
          id?: string
          nome?: string
          quantidade_disponivel?: number | null
        }
        Relationships: []
      }
      pro_lembretes: {
        Row: {
          created_at: string | null
          enviado: boolean | null
          gestor_id: string
          id: string
          lembrar_em: string
          mensagem: string
        }
        Insert: {
          created_at?: string | null
          enviado?: boolean | null
          gestor_id: string
          id?: string
          lembrar_em: string
          mensagem: string
        }
        Update: {
          created_at?: string | null
          enviado?: boolean | null
          gestor_id?: string
          id?: string
          lembrar_em?: string
          mensagem?: string
        }
        Relationships: [
          {
            foreignKeyName: "pro_lembretes_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "gestores"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_registros: {
        Row: {
          created_at: string | null
          data: string | null
          descricao: string | null
          gestor_id: string
          id: string
          tipo: string
          valor: number | null
        }
        Insert: {
          created_at?: string | null
          data?: string | null
          descricao?: string | null
          gestor_id: string
          id?: string
          tipo: string
          valor?: number | null
        }
        Update: {
          created_at?: string | null
          data?: string | null
          descricao?: string | null
          gestor_id?: string
          id?: string
          tipo?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pro_registros_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "gestores"
            referencedColumns: ["id"]
          },
        ]
      }
      progresso: {
        Row: {
          acertos: number
          aluno_id: string
          aprovado: boolean
          aula_id: string
          created_at: string | null
          id: string
          pendente_liberacao: boolean
          percentual: number
          proxima_aula_liberada_em: string | null
          respostas: Json | null
          tenant_id: string | null
          tentativa_numero: number
          total_questoes: number
          whatsapp_notificado: boolean | null
          whatsapp_notificado_em: string | null
        }
        Insert: {
          acertos: number
          aluno_id: string
          aprovado: boolean
          aula_id: string
          created_at?: string | null
          id?: string
          pendente_liberacao?: boolean
          percentual: number
          proxima_aula_liberada_em?: string | null
          respostas?: Json | null
          tenant_id?: string | null
          tentativa_numero?: number
          total_questoes: number
          whatsapp_notificado?: boolean | null
          whatsapp_notificado_em?: string | null
        }
        Update: {
          acertos?: number
          aluno_id?: string
          aprovado?: boolean
          aula_id?: string
          created_at?: string | null
          id?: string
          pendente_liberacao?: boolean
          percentual?: number
          proxima_aula_liberada_em?: string | null
          respostas?: Json | null
          tenant_id?: string | null
          tentativa_numero?: number
          total_questoes?: number
          whatsapp_notificado?: boolean | null
          whatsapp_notificado_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progresso_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progresso_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progresso_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      questoes: {
        Row: {
          alternativas: Json
          ativa: boolean | null
          aula_id: string
          created_at: string | null
          enunciado: string
          explicacao: string | null
          id: string
          ordem: number
          updated_at: string | null
        }
        Insert: {
          alternativas: Json
          ativa?: boolean | null
          aula_id: string
          created_at?: string | null
          enunciado: string
          explicacao?: string | null
          id?: string
          ordem: number
          updated_at?: string | null
        }
        Update: {
          alternativas?: Json
          ativa?: boolean | null
          aula_id?: string
          created_at?: string | null
          enunciado?: string
          explicacao?: string | null
          id?: string
          ordem?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questoes_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      reacoes_aula: {
        Row: {
          aluno_id: string
          aula_id: string
          comentario: string | null
          created_at: string | null
          id: string
          nota: number
        }
        Insert: {
          aluno_id: string
          aula_id: string
          comentario?: string | null
          created_at?: string | null
          id?: string
          nota: number
        }
        Update: {
          aluno_id?: string
          aula_id?: string
          comentario?: string | null
          created_at?: string | null
          id?: string
          nota?: number
        }
        Relationships: []
      }
      resgates: {
        Row: {
          aluno_id: string
          created_at: string | null
          id: string
          premio_id: string
          status: string | null
        }
        Insert: {
          aluno_id: string
          created_at?: string | null
          id?: string
          premio_id: string
          status?: string | null
        }
        Update: {
          aluno_id?: string
          created_at?: string | null
          id?: string
          premio_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resgates_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resgates_premio_id_fkey"
            columns: ["premio_id"]
            isOneToOne: false
            referencedRelation: "premios"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          email: string
          id: string
          nome: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          nome: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tenant_domains: {
        Row: {
          created_at: string | null
          domain: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          domain: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          domain?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_domains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      verificacao_otp: {
        Row: {
          canal: string | null
          codigo: string
          created_at: string | null
          expira_em: string
          id: string
          usado: boolean | null
          user_id: string
        }
        Insert: {
          canal?: string | null
          codigo: string
          created_at?: string | null
          expira_em: string
          id?: string
          usado?: boolean | null
          user_id: string
        }
        Update: {
          canal?: string | null
          codigo?: string
          created_at?: string | null
          expira_em?: string
          id?: string
          usado?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          id: string
          acao: string
          entidade: string
          entidade_id: string | null
          tenant_id: string | null
          usuario_id: string | null
          usuario_tipo: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          ip: string | null
          created_at: string
        }
        Insert: {
          id?: string
          acao: string
          entidade: string
          entidade_id?: string | null
          tenant_id?: string | null
          usuario_id?: string | null
          usuario_tipo?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          ip?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          acao?: string
          entidade?: string
          entidade_id?: string | null
          tenant_id?: string | null
          usuario_id?: string | null
          usuario_tipo?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          ip?: string | null
          created_at?: string
        }
        Relationships: []
      }
      pdf_jobs: {
        Row: {
          id: string
          contrato_id: string | null
          tenant_id: string | null
          status: string
          tentativas: number
          erro: string | null
          created_at: string
          processado_em: string | null
        }
        Insert: {
          id?: string
          contrato_id?: string | null
          tenant_id?: string | null
          status?: string
          tentativas?: number
          erro?: string | null
          created_at?: string
          processado_em?: string | null
        }
        Update: {
          id?: string
          contrato_id?: string | null
          tenant_id?: string | null
          status?: string
          tentativas?: number
          erro?: string | null
          created_at?: string
          processado_em?: string | null
        }
        Relationships: []
      }
      mensagens_template: {
        Row: {
          id: string
          tenant_id: string | null
          chave: string
          texto: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          chave: string
          texto: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          chave?: string
          texto?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          id: string
          fonte: string
          txid: string
          payload: Json
          status: string
          tentativas: number
          erro: string | null
          created_at: string
          processado_em: string | null
        }
        Insert: {
          id?: string
          fonte?: string
          txid: string
          payload: Json
          status?: string
          tentativas?: number
          erro?: string | null
          created_at?: string
          processado_em?: string | null
        }
        Update: {
          id?: string
          fonte?: string
          txid?: string
          payload?: Json
          status?: string
          tentativas?: number
          erro?: string | null
          created_at?: string
          processado_em?: string | null
        }
        Relationships: []
      }
      agente_config: {
        Row: { id: string; tenant_id: string | null; nome_assistente: string; instancia_whatsapp: string | null; prompt_extra: string | null; modelo: string; creditos_boas_vindas: number; ativo: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; tenant_id?: string | null; nome_assistente?: string; instancia_whatsapp?: string | null; prompt_extra?: string | null; modelo?: string; creditos_boas_vindas?: number; ativo?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; tenant_id?: string | null; nome_assistente?: string; instancia_whatsapp?: string | null; prompt_extra?: string | null; modelo?: string; creditos_boas_vindas?: number; ativo?: boolean; updated_at?: string }
        Relationships: []
      }
      agente_argumentos: {
        Row: { id: string; tenant_id: string | null; categoria: string; argumento: string; ordem: number; ativo: boolean; created_at: string }
        Insert: { id?: string; tenant_id?: string | null; categoria: string; argumento: string; ordem?: number; ativo?: boolean; created_at?: string }
        Update: { id?: string; tenant_id?: string | null; categoria?: string; argumento?: string; ordem?: number; ativo?: boolean }
        Relationships: []
      }
      agente_pacotes: {
        Row: { id: string; tenant_id: string | null; nome: string; creditos: number; valor: number; ordem: number; ativo: boolean; created_at: string }
        Insert: { id?: string; tenant_id?: string | null; nome: string; creditos: number; valor: number; ordem?: number; ativo?: boolean; created_at?: string }
        Update: { id?: string; tenant_id?: string | null; nome?: string; creditos?: number; valor?: number; ordem?: number; ativo?: boolean }
        Relationships: []
      }
      agente_creditos: {
        Row: { id: string; gestor_id: string; tenant_id: string | null; saldo: number; updated_at: string }
        Insert: { id?: string; gestor_id: string; tenant_id?: string | null; saldo?: number; updated_at?: string }
        Update: { id?: string; gestor_id?: string; tenant_id?: string | null; saldo?: number; updated_at?: string }
        Relationships: []
      }
      agente_transacoes: {
        Row: { id: string; gestor_id: string; tenant_id: string | null; tipo: string; creditos: number; valor_pago: number | null; cobranca_id: string | null; descricao: string; created_at: string }
        Insert: { id?: string; gestor_id: string; tenant_id?: string | null; tipo: string; creditos: number; valor_pago?: number | null; cobranca_id?: string | null; descricao: string; created_at?: string }
        Update: { id?: string; tipo?: string; creditos?: number; valor_pago?: number | null; cobranca_id?: string | null; descricao?: string }
        Relationships: []
      }
      agente_recargas: {
        Row: { id: string; gestor_id: string; tenant_id: string | null; pacote_id: string | null; creditos: number; valor: number; txid: string; status: string; created_at: string; pago_em: string | null }
        Insert: { id?: string; gestor_id: string; tenant_id?: string | null; pacote_id?: string | null; creditos: number; valor: number; txid: string; status?: string; created_at?: string; pago_em?: string | null }
        Update: { id?: string; status?: string; pago_em?: string | null }
        Relationships: []
      }
      agente_sessoes: {
        Row: { id: string; gestor_id: string; estado: string; dados: Json; expires_at: string; created_at: string }
        Insert: { id?: string; gestor_id: string; estado: string; dados?: Json; expires_at: string; created_at?: string }
        Update: { id?: string; gestor_id?: string; estado?: string; dados?: Json; expires_at?: string }
        Relationships: []
      }
      agente_config_global: {
        Row: { id: string; nome_assistente: string; prompt_base: string | null; modelo_padrao: string; creditos_boas_vindas_padrao: number; ativo: boolean; criado_por: string | null; updated_at: string }
        Insert: { id?: string; nome_assistente?: string; prompt_base?: string | null; modelo_padrao?: string; creditos_boas_vindas_padrao?: number; ativo?: boolean; criado_por?: string | null; updated_at?: string }
        Update: { nome_assistente?: string; prompt_base?: string | null; modelo_padrao?: string; creditos_boas_vindas_padrao?: number; ativo?: boolean; criado_por?: string | null; updated_at?: string }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      obter_trilha_aluno: {
        Args: { p_aluno_id: string }
        Returns: {
          aula_descricao: string
          aula_id: string
          aula_ordem: number
          aula_titulo: string
          capa_url: string
          duracao_minutos: number
          liberada_em: string
          melhor_percentual: number
          modulo_id: string
          modulo_ordem: number
          modulo_titulo: string
          progresso_created_at: string
          status: string
          validade_meses: number
          youtube_video_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
