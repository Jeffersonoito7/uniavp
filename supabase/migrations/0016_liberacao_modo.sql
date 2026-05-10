-- Modo de liberação da próxima aula após aprovação no quiz
ALTER TABLE aulas
  ADD COLUMN IF NOT EXISTS liberacao_modo TEXT NOT NULL DEFAULT 'automatico'
  CONSTRAINT liberacao_modo_check CHECK (liberacao_modo IN ('automatico', 'manual_gestor', 'manual_admin'));

-- Flag para liberações manuais pendentes
ALTER TABLE progresso
  ADD COLUMN IF NOT EXISTS pendente_liberacao BOOLEAN NOT NULL DEFAULT FALSE;
