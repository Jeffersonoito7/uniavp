CREATE TABLE IF NOT EXISTS gestores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_gestores_user ON gestores(user_id) WHERE ativo = TRUE;
CREATE INDEX idx_gestores_whatsapp ON gestores(whatsapp);
