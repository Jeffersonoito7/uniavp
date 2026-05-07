-- Super admins (donos da plataforma - Oito7 Digital)
CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clientes (empresas que compram a plataforma)
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  dominio TEXT DEFAULT '',
  plano TEXT DEFAULT 'basico',
  ativo BOOLEAN DEFAULT TRUE,
  contato_nome TEXT DEFAULT '',
  contato_whatsapp TEXT DEFAULT '',
  contato_email TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Primeiro cliente: Uni AVP
INSERT INTO clientes (nome, dominio, plano, contato_nome, contato_email)
VALUES ('Auto Vale Prevenções — Uni AVP', 'uniavp.autovaleprevencoes.org.br', 'premium', 'Jefferson Soares', 'oito7digital@gmail.com')
ON CONFLICT DO NOTHING;
