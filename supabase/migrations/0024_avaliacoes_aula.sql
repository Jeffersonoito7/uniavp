CREATE TABLE IF NOT EXISTS aula_avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  estrelas INTEGER NOT NULL CHECK (estrelas BETWEEN 1 AND 5),
  sugestao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(aluno_id, aula_id)
);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_aula_id ON aula_avaliacoes(aula_id);
