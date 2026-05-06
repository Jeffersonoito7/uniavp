CREATE TABLE IF NOT EXISTS comentarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  aluno_id UUID REFERENCES alunos(id) ON DELETE SET NULL,
  texto TEXT NOT NULL,
  parent_id UUID REFERENCES comentarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_comentarios_aula ON comentarios(aula_id);
