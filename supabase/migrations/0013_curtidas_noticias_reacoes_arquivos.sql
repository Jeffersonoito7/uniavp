-- Curtidas nas aulas
CREATE TABLE IF NOT EXISTS aula_curtidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL,
  aula_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(aluno_id, aula_id)
);

-- Mural de notícias
CREATE TABLE IF NOT EXISTS noticias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  conteudo TEXT DEFAULT '',
  imagem_url TEXT DEFAULT '',
  publicado BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pesquisa de reação pós-aula
CREATE TABLE IF NOT EXISTS reacoes_aula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL,
  aula_id UUID NOT NULL,
  nota INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(aluno_id, aula_id)
);

-- Arquivos para download nas aulas
CREATE TABLE IF NOT EXISTS aula_arquivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id UUID NOT NULL,
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
