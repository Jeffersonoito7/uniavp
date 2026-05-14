CREATE TABLE IF NOT EXISTS verificacao_otp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  codigo TEXT NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL,
  usado BOOLEAN DEFAULT FALSE,
  canal TEXT DEFAULT 'whatsapp',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_verificacao_otp_user_id ON verificacao_otp(user_id);
CREATE INDEX IF NOT EXISTS idx_verificacao_otp_expira ON verificacao_otp(expira_em);
