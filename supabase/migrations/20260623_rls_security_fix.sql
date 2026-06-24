-- ============================================================
-- CORRECAO GERAL DE SEGURANCA - Security Advisor
-- Habilita RLS em todas as tabelas publicas e corrige funcao
-- ============================================================

-- 1. TABELAS COM RLS DESATIVADO
--    Service role bypassa RLS em todas as rotas de API,
--    entao habilitar nao quebra nada na aplicacao.

ALTER TABLE public.indicadores        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admins       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questoes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gestores           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progresso          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_domains     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_painel  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artes_templates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noticias           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biblioteca         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fila_whatsapp      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_whatsapp       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agente_sessoes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agente_creditos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agente_transacoes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agente_pacotes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agente_recargas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agente_argumentos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agente_config      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_jobs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_registros      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_lembretes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gestor_pagamentos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_topicos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_respostas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reacoes_aula       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aula_avaliacoes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aula_arquivos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aula_curtidas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medalhas_config    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aluno_medalhas     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aluno_pontos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premios            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resgates           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verificacao_otp    ENABLE ROW LEVEL SECURITY;

-- 2. POLITICAS MINIMAS para tabelas criticas
--    (usuario autenticado pode ler o proprio registro)

-- super_admins: cada super admin le o proprio registro
DROP POLICY IF EXISTS "super_admins_self_read" ON public.super_admins;
CREATE POLICY "super_admins_self_read" ON public.super_admins
  FOR SELECT USING (auth.uid() = user_id);

-- admins: cada admin le o proprio registro
DROP POLICY IF EXISTS "admins_self_read" ON public.admins;
CREATE POLICY "admins_self_read" ON public.admins
  FOR SELECT USING (auth.uid() = user_id);

-- gestores: gestor le o proprio registro
DROP POLICY IF EXISTS "gestores_self_read" ON public.gestores;
CREATE POLICY "gestores_self_read" ON public.gestores
  FOR SELECT USING (auth.uid() = user_id);

-- alunos: aluno le o proprio registro
DROP POLICY IF EXISTS "alunos_self_read" ON public.alunos;
CREATE POLICY "alunos_self_read" ON public.alunos
  FOR SELECT USING (auth.uid() = user_id);

-- push_subscriptions: usuario gerencia a propria subscription
DROP POLICY IF EXISTS "push_sub_self" ON public.push_subscriptions;
CREATE POLICY "push_sub_self" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- 3. CORRIGIR CAMINHO DE BUSCA DA FUNCAO trigger_set_updated_at
--    (previne ataques de search_path injection)

CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
