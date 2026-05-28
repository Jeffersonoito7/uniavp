-- =============================================================
-- MIGRATION: Infraestrutura de confiabilidade
-- Executar no Supabase Dashboard > SQL Editor
-- =============================================================

-- ── 1. Audit Log ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acao           text NOT NULL,
  entidade       text NOT NULL,
  entidade_id    text,
  tenant_id      uuid REFERENCES clientes(id) ON DELETE SET NULL,
  usuario_id     uuid,
  usuario_tipo   text CHECK (usuario_tipo IN ('aluno','gestor','admin','super','sistema')),
  dados_anteriores jsonb,
  dados_novos    jsonb,
  ip             text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_tenant     ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_acao        ON audit_log(acao);
CREATE INDEX IF NOT EXISTS idx_audit_log_entidade_id ON audit_log(entidade_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at  ON audit_log(created_at DESC);

-- Somente service_role pode inserir/ler — nenhum cliente acessa diretamente
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON audit_log USING (false);

-- ── 2. Fila de PDFs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pdf_jobs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id    uuid REFERENCES contratos(id) ON DELETE CASCADE,
  tenant_id      uuid,
  status         text NOT NULL DEFAULT 'pendente'
                 CHECK (status IN ('pendente','processando','concluido','erro')),
  tentativas     int NOT NULL DEFAULT 0,
  erro           text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  processado_em  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_pdf_jobs_status     ON pdf_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_pdf_jobs_contrato   ON pdf_jobs(contrato_id);

ALTER TABLE pdf_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON pdf_jobs USING (false);

-- ── 3. Fila de Webhooks (retry) ───────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fonte          text NOT NULL DEFAULT 'efi',
  txid           text NOT NULL,
  payload        jsonb NOT NULL,
  status         text NOT NULL DEFAULT 'pendente'
                 CHECK (status IN ('pendente','processando','processado','erro','descartado')),
  tentativas     int NOT NULL DEFAULT 0,
  erro           text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  processado_em  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_status    ON webhook_events(status, created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_txid      ON webhook_events(txid);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON webhook_events USING (false);

-- ── 4. RLS nas tabelas existentes ─────────────────────────────
-- Habilita RLS como segunda linha de defesa (o app-server usa service_role
-- e bypassa RLS, mas impede acesso direto caso alguma chave vaze)

ALTER TABLE alunos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE gestores   ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE progresso  ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE aulas      ENABLE ROW LEVEL SECURITY;

-- Politica padrao: nenhum acesso direto pelo client anon/authenticated
-- O backend usa SEMPRE service_role (bypassa RLS automaticamente)
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['alunos','gestores','contratos','progresso','configuracoes','modulos','aulas']
  LOOP
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS "deny_direct_access" ON %I USING (false)',
      t
    );
  END LOOP;
END $$;
