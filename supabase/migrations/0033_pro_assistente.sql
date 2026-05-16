-- Registros financeiros do PRO (cotações, adesões, despesas)
CREATE TABLE IF NOT EXISTS pro_registros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gestor_id UUID REFERENCES gestores(id) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('cotacao', 'adesao', 'despesa')),
  descricao TEXT,
  valor DECIMAL(10,2) DEFAULT 0,
  data DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pro_registros_gestor ON pro_registros(gestor_id);
CREATE INDEX IF NOT EXISTS idx_pro_registros_data ON pro_registros(data);

-- Lembretes do PRO
CREATE TABLE IF NOT EXISTS pro_lembretes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gestor_id UUID REFERENCES gestores(id) NOT NULL,
  mensagem TEXT NOT NULL,
  lembrar_em TIMESTAMPTZ NOT NULL,
  enviado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pro_lembretes_gestor ON pro_lembretes(gestor_id);
CREATE INDEX IF NOT EXISTS idx_pro_lembretes_envio ON pro_lembretes(lembrar_em, enviado);
