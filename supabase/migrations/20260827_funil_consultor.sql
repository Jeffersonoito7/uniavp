-- Funil de onboarding de consultores via WhatsApp
-- Estados: 0=nao iniciado, 1=aguardando interesse, 2=aguardando video PP,
--          3=quiz em andamento, 4=integrado, -1=nao interessado

ALTER TABLE alunos
  ADD COLUMN IF NOT EXISTS funil_estado       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS funil_pergunta_atual INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS funil_respostas    JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS funil_nota_quiz    INTEGER,
  ADD COLUMN IF NOT EXISTS funil_iniciado_em  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS funil_concluido_em TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_alunos_funil_estado ON alunos(funil_estado)
  WHERE funil_estado > 0 AND funil_estado < 4;

-- Perguntas do quiz por tenant
CREATE TABLE IF NOT EXISTS funil_perguntas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID REFERENCES clientes(id) ON DELETE CASCADE,
  ordem       INTEGER NOT NULL DEFAULT 0,
  texto       TEXT NOT NULL,
  alternativas JSONB NOT NULL DEFAULT '[]',
  ativa       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funil_perguntas_tenant ON funil_perguntas(tenant_id, ordem)
  WHERE ativa = TRUE;

CREATE TRIGGER trg_funil_perguntas_updated_at
  BEFORE UPDATE ON funil_perguntas
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Configuracoes do funil (reutiliza tabela configuracoes existente com tenant_id)
-- funil_link_south   => URL do sistema South para cadastro
-- funil_nota_corte   => percentual minimo de acerto (ex: "70")
-- funil_video_pp     => link do video Primeiros Passos
-- Inserir defaults globais (sem tenant) como fallback
INSERT INTO configuracoes (chave, valor, descricao) VALUES
  ('funil_link_south', '"https://south.com.br/cadastro"', 'URL de cadastro no sistema South (funil consultor)'),
  ('funil_nota_corte', '70', 'Nota minima do quiz do funil (0-100)'),
  ('funil_video_pp', '"https://youtube.com/watch?v=SEU_VIDEO"', 'Link do video Primeiros Passos do funil')
ON CONFLICT (chave) DO NOTHING;
