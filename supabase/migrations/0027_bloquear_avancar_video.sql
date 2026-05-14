-- Impede que o aluno avance o vídeo antes de assistir
ALTER TABLE aulas
  ADD COLUMN IF NOT EXISTS bloquear_avancar BOOLEAN DEFAULT false;
