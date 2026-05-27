-- Tabela de log de mensagens WhatsApp enviadas pelos crons.
-- Garante idempotência: um cron que rodar duas vezes no mesmo dia
-- não enviará duplicatas para o mesmo destinatário/chave.

CREATE TABLE IF NOT EXISTS mensagens_log (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario text        NOT NULL,
  chave        text        NOT NULL,
  tenant_id    uuid        REFERENCES clientes(id) ON DELETE CASCADE,
  enviado_em   date        NOT NULL DEFAULT CURRENT_DATE,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Garante unicidade por destinatário + chave + dia
CREATE UNIQUE INDEX IF NOT EXISTS idx_mensagens_log_diario
  ON mensagens_log (destinatario, chave, enviado_em);

-- RLS habilitado; service role bypassa automaticamente
ALTER TABLE mensagens_log ENABLE ROW LEVEL SECURITY;

-- Índice de limpeza (para futura purga de registros antigos)
CREATE INDEX IF NOT EXISTS idx_mensagens_log_data
  ON mensagens_log (enviado_em);
