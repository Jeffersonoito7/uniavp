-- ═══════════════════════════════════════════════════════════════
-- RLS por tenant — defesa em profundidade
-- O backend usa service_role (bypassa RLS automaticamente).
-- Estas políticas protegem acesso direto com JWT de usuário.
-- ═══════════════════════════════════════════════════════════════

-- ── Helper functions ─────────────────────────────────────────────
-- SECURITY DEFINER: rodam como postgres, bypassing RLS interno,
-- mas auth.uid() continua sendo o usuário chamador.

CREATE OR REPLACE FUNCTION auth_admin_tenant_id()
RETURNS UUID LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT tenant_id FROM admins
  WHERE user_id = auth.uid() AND ativo = true
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION auth_gestor_id()
RETURNS UUID LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT id FROM gestores
  WHERE user_id = auth.uid() AND ativo = true
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION auth_aluno_id()
RETURNS UUID LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT id FROM alunos
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- ── admins ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "deny_direct"        ON admins;
DROP POLICY IF EXISTS "deny_direct_access" ON admins;

CREATE POLICY "admins_read" ON admins FOR SELECT USING (
  user_id = auth.uid()
  OR tenant_id = auth_admin_tenant_id()
);
CREATE POLICY "admins_write" ON admins FOR INSERT WITH CHECK (
  tenant_id = auth_admin_tenant_id()
);
CREATE POLICY "admins_update" ON admins FOR UPDATE USING (
  tenant_id = auth_admin_tenant_id()
);

-- ── alunos ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "deny_direct"        ON alunos;
DROP POLICY IF EXISTS "deny_direct_access" ON alunos;

CREATE POLICY "alunos_read" ON alunos FOR SELECT USING (
  user_id = auth.uid()
  OR tenant_id = auth_admin_tenant_id()
);
CREATE POLICY "alunos_insert" ON alunos FOR INSERT WITH CHECK (
  tenant_id = auth_admin_tenant_id()
);
CREATE POLICY "alunos_update" ON alunos FOR UPDATE USING (
  user_id = auth.uid()
  OR tenant_id = auth_admin_tenant_id()
);

-- ── gestores ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "deny_direct"        ON gestores;
DROP POLICY IF EXISTS "deny_direct_access" ON gestores;

CREATE POLICY "gestores_read" ON gestores FOR SELECT USING (
  user_id = auth.uid()
  OR tenant_id = auth_admin_tenant_id()
);
CREATE POLICY "gestores_insert" ON gestores FOR INSERT WITH CHECK (
  user_id = auth.uid()
  OR tenant_id = auth_admin_tenant_id()
);
CREATE POLICY "gestores_update" ON gestores FOR UPDATE USING (
  user_id = auth.uid()
  OR tenant_id = auth_admin_tenant_id()
);

-- ── configuracoes ────────────────────────────────────────────────
DROP POLICY IF EXISTS "deny_direct"        ON configuracoes;
DROP POLICY IF EXISTS "deny_direct_access" ON configuracoes;

-- Leitura: qualquer autenticado lê config do próprio tenant
CREATE POLICY "config_read" ON configuracoes FOR SELECT USING (
  tenant_id = auth_admin_tenant_id()
  OR tenant_id IS NULL
);
-- Escrita: apenas admins do tenant
CREATE POLICY "config_write" ON configuracoes FOR INSERT WITH CHECK (
  tenant_id = auth_admin_tenant_id()
);
CREATE POLICY "config_update" ON configuracoes FOR UPDATE USING (
  tenant_id = auth_admin_tenant_id()
);
CREATE POLICY "config_delete" ON configuracoes FOR DELETE USING (
  tenant_id = auth_admin_tenant_id()
);

-- ── modulos e aulas (conteúdo do tenant) ─────────────────────────
DROP POLICY IF EXISTS "deny_direct"        ON modulos;
DROP POLICY IF EXISTS "deny_direct_access" ON modulos;
CREATE POLICY "modulos_read" ON modulos FOR SELECT USING (
  tenant_id = auth_admin_tenant_id()
);
CREATE POLICY "modulos_write" ON modulos FOR INSERT WITH CHECK (
  tenant_id = auth_admin_tenant_id()
);
CREATE POLICY "modulos_update" ON modulos FOR UPDATE USING (
  tenant_id = auth_admin_tenant_id()
);
CREATE POLICY "modulos_delete" ON modulos FOR DELETE USING (
  tenant_id = auth_admin_tenant_id()
);

DROP POLICY IF EXISTS "deny_direct"        ON aulas;
DROP POLICY IF EXISTS "deny_direct_access" ON aulas;
CREATE POLICY "aulas_read" ON aulas FOR SELECT USING (
  tenant_id = auth_admin_tenant_id()
);
CREATE POLICY "aulas_write" ON aulas FOR INSERT WITH CHECK (
  tenant_id = auth_admin_tenant_id()
);
CREATE POLICY "aulas_update" ON aulas FOR UPDATE USING (
  tenant_id = auth_admin_tenant_id()
);
CREATE POLICY "aulas_delete" ON aulas FOR DELETE USING (
  tenant_id = auth_admin_tenant_id()
);

-- ── progresso ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "deny_direct"        ON progresso;
DROP POLICY IF EXISTS "deny_direct_access" ON progresso;

CREATE POLICY "progresso_read" ON progresso FOR SELECT USING (
  aluno_id = auth_aluno_id()
  OR tenant_id = auth_admin_tenant_id()
);
CREATE POLICY "progresso_write" ON progresso FOR INSERT WITH CHECK (
  aluno_id = auth_aluno_id()
);
CREATE POLICY "progresso_update" ON progresso FOR UPDATE USING (
  aluno_id = auth_aluno_id()
);

-- ── contratos ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "deny_direct"        ON contratos;
DROP POLICY IF EXISTS "deny_direct_access" ON contratos;

CREATE POLICY "contratos_read" ON contratos FOR SELECT USING (
  tenant_id = auth_admin_tenant_id()
  OR aluno_id = auth_aluno_id()
);
CREATE POLICY "contratos_write" ON contratos FOR INSERT WITH CHECK (
  tenant_id = auth_admin_tenant_id()
);
CREATE POLICY "contratos_update" ON contratos FOR UPDATE USING (
  tenant_id = auth_admin_tenant_id()
);

-- ── biblioteca ───────────────────────────────────────────────────
-- RLS já habilitado na migration de criação; policy deny_direct existe
DROP POLICY IF EXISTS "deny_direct" ON biblioteca;

CREATE POLICY "biblioteca_read" ON biblioteca FOR SELECT USING (
  tenant_id = auth_admin_tenant_id()
);
CREATE POLICY "biblioteca_write" ON biblioteca FOR INSERT WITH CHECK (
  tenant_id = auth_admin_tenant_id()
);
CREATE POLICY "biblioteca_update" ON biblioteca FOR UPDATE USING (
  tenant_id = auth_admin_tenant_id()
);
CREATE POLICY "biblioteca_delete" ON biblioteca FOR DELETE USING (
  tenant_id = auth_admin_tenant_id()
);

-- ── mensagens_template ───────────────────────────────────────────
DROP POLICY IF EXISTS "deny_direct" ON mensagens_template;

CREATE POLICY "msg_template_read" ON mensagens_template FOR SELECT USING (
  tenant_id = auth_admin_tenant_id()
  OR tenant_id IS NULL
);
CREATE POLICY "msg_template_write" ON mensagens_template FOR INSERT WITH CHECK (
  tenant_id = auth_admin_tenant_id()
);
CREATE POLICY "msg_template_update" ON mensagens_template FOR UPDATE USING (
  tenant_id = auth_admin_tenant_id()
);

-- ── agente_sessoes (gestor lê/escreve a própria) ─────────────────
DROP POLICY IF EXISTS "deny_direct" ON agente_sessoes;

CREATE POLICY "agente_sessoes_own" ON agente_sessoes FOR ALL USING (
  gestor_id = auth_gestor_id()
);

-- ── agente_creditos (gestor lê o próprio saldo) ──────────────────
DROP POLICY IF EXISTS "deny_direct" ON agente_creditos;

CREATE POLICY "agente_creditos_read" ON agente_creditos FOR SELECT USING (
  gestor_id = auth_gestor_id()
  OR tenant_id = auth_admin_tenant_id()
);

-- ── indicadores (aluno vê o próprio; admin vê o tenant) ──────────
DROP POLICY IF EXISTS "deny_direct"        ON indicadores;
DROP POLICY IF EXISTS "deny_direct_access" ON indicadores;

CREATE POLICY "indicadores_read" ON indicadores FOR SELECT USING (
  tenant_id = auth_admin_tenant_id()
);

-- ── TABELAS DE SISTEMA: mantém deny_direct ───────────────────────
-- webhook_events, fila_whatsapp, audit_log, pdf_jobs,
-- cobrancas, gestor_pagamentos, agente_recargas, agente_transacoes
-- Nenhuma policy modificada — service_role bypassa, authenticated bloqueado.
