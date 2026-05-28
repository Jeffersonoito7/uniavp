-- =============================================================
-- MIGRATION: Templates de mensagem WhatsApp por tenant
-- =============================================================

CREATE TABLE IF NOT EXISTS mensagens_template (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid REFERENCES clientes(id) ON DELETE CASCADE,
  chave      text NOT NULL,
  texto      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unicidade: um template por chave por tenant (ou global se tenant_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_mensagens_template_tenant_chave
  ON mensagens_template(chave, tenant_id) WHERE tenant_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mensagens_template_global_chave
  ON mensagens_template(chave) WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_mensagens_template_tenant
  ON mensagens_template(tenant_id);

ALTER TABLE mensagens_template ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON mensagens_template USING (false);
