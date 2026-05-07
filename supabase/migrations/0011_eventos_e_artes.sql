-- Tabela de eventos
CREATE TABLE IF NOT EXISTS eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  cidade TEXT DEFAULT '',
  data_hora TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de templates de artes
CREATE TABLE IF NOT EXISTS artes_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  arte_url TEXT DEFAULT '',
  foto_x NUMERIC DEFAULT 35,
  foto_y NUMERIC DEFAULT 15,
  foto_largura NUMERIC DEFAULT 30,
  foto_altura NUMERIC DEFAULT 30,
  foto_redondo BOOLEAN DEFAULT TRUE,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO artes_templates (tipo, titulo) VALUES
  ('boas_vindas',  'Boas-vindas'),
  ('10_placas',    'Parabéns - 10 Placas'),
  ('15_placas',    'Parabéns - 15 Placas'),
  ('20_placas',    'Parabéns - 20 Placas'),
  ('25_placas',    'Parabéns - 25 Placas'),
  ('30_placas',    'Parabéns - 30 Placas'),
  ('novo_gestor',  'Parabéns - Novo Gestor')
ON CONFLICT (tipo) DO NOTHING;
