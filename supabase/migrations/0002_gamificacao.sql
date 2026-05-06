CREATE TABLE IF NOT EXISTS medalhas_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  descricao TEXT,
  icone TEXT DEFAULT '🏆',
  tipo TEXT NOT NULL CHECK (tipo IN ('primeira_aula','modulo_concluido','quiz_perfeito','conclusao_geral','streak_3dias')),
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aluno_medalhas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  medalha_id UUID NOT NULL REFERENCES medalhas_config(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(aluno_id, medalha_id)
);

CREATE TABLE IF NOT EXISTS aluno_pontos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL,
  motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS premios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  descricao TEXT,
  custo_pontos INTEGER NOT NULL DEFAULT 100,
  quantidade_disponivel INTEGER,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resgates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  premio_id UUID NOT NULL REFERENCES premios(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','entregue')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO medalhas_config (nome, descricao, icone, tipo) VALUES
  ('Primeira Aula', 'Completou sua primeira aula', '🎯', 'primeira_aula'),
  ('Módulo Concluído', 'Concluiu um módulo completo', '📚', 'modulo_concluido'),
  ('Quiz Perfeito', 'Acertou 100% em um quiz', '⭐', 'quiz_perfeito'),
  ('Graduado AVP', 'Concluiu toda a trilha de formação', '🎓', 'conclusao_geral')
ON CONFLICT DO NOTHING;
