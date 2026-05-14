-- Adiciona campos de assinatura na tabela gestores
ALTER TABLE gestores ADD COLUMN IF NOT EXISTS status_assinatura TEXT DEFAULT 'trial';
ALTER TABLE gestores ADD COLUMN IF NOT EXISTS trial_expira_em TIMESTAMPTZ;
ALTER TABLE gestores ADD COLUMN IF NOT EXISTS plano_vencimento TIMESTAMPTZ;
ALTER TABLE gestores ADD COLUMN IF NOT EXISTS pix_txid TEXT;

-- Índice para buscas por status
CREATE INDEX IF NOT EXISTS idx_gestores_status_assinatura ON gestores(status_assinatura);

-- Tabela de pagamentos do gestor
CREATE TABLE IF NOT EXISTS gestor_pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gestor_id UUID NOT NULL REFERENCES gestores(id) ON DELETE CASCADE,
  txid TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL DEFAULT 100.00,
  status TEXT NOT NULL DEFAULT 'pendente',
  pix_copia_cola TEXT,
  qrcode_base64 TEXT,
  vencimento DATE,
  pago_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gestor_pagamentos_gestor_id ON gestor_pagamentos(gestor_id);
CREATE INDEX IF NOT EXISTS idx_gestor_pagamentos_txid ON gestor_pagamentos(txid);
