ALTER TABLE aulas ADD COLUMN IF NOT EXISTS quiz_tipo TEXT NOT NULL DEFAULT 'obrigatorio'
  CONSTRAINT quiz_tipo_check CHECK (quiz_tipo IN ('obrigatorio', 'opcional', 'nenhum'));
