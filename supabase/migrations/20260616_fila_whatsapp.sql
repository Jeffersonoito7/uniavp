-- Fila de mensagens WhatsApp para retry em caso de falha da Evolution API
CREATE TABLE IF NOT EXISTS fila_whatsapp (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero      TEXT NOT NULL,
  mensagem    TEXT NOT NULL,
  instancia   TEXT,
  tenant_id   UUID REFERENCES clientes(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'pendente',
  tentativas  INT  NOT NULL DEFAULT 0,
  erro        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processado_em TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fila_whatsapp_status ON fila_whatsapp(status) WHERE status IN ('pendente', 'erro');

ALTER TABLE fila_whatsapp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_direct" ON fila_whatsapp FOR ALL USING (false);
