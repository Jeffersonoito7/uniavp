-- Adiciona gestor_id na tabela eventos para isolar eventos por gestor
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS gestor_id UUID REFERENCES gestores(id) ON DELETE CASCADE;

-- Índice para busca por gestor
CREATE INDEX IF NOT EXISTS idx_eventos_gestor_id ON eventos(gestor_id);
