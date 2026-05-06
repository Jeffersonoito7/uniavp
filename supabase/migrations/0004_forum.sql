CREATE TABLE IF NOT EXISTS forum_topicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  aluno_id UUID REFERENCES alunos(id) ON DELETE SET NULL,
  fixado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_respostas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topico_id UUID NOT NULL REFERENCES forum_topicos(id) ON DELETE CASCADE,
  aluno_id UUID REFERENCES alunos(id) ON DELETE SET NULL,
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
