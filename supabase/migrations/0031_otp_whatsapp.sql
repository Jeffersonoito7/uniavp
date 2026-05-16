-- Tabela para OTP de verificação de número WhatsApp no cadastro
CREATE TABLE IF NOT EXISTS otp_whatsapp (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp   TEXT        NOT NULL,
  codigo     TEXT        NOT NULL,
  expira_em  TIMESTAMPTZ NOT NULL,
  usado      BOOLEAN     DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_whatsapp_wpp    ON otp_whatsapp(whatsapp);
CREATE INDEX IF NOT EXISTS idx_otp_whatsapp_expira ON otp_whatsapp(expira_em);

-- Limpar códigos expirados automaticamente (opcional, via cron ou TTL)
-- Por ora os endpoints ignoram os expirados na query
