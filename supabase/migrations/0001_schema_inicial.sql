-- ═══════════════════════════════════════════════════════════════════════
-- UNI AVP — SCHEMA DO BANCO
-- ═══════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- INDICADORES (gestores/consultores que indicam novos alunos)
CREATE TABLE indicadores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('gestor', 'consultor')),
  whatsapp TEXT NOT NULL,
  email TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_indicadores_ativo ON indicadores(ativo) WHERE ativo = TRUE;

-- ALUNOS (consultores em formação)
CREATE TABLE alunos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  indicador_id UUID REFERENCES indicadores(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','pausado','concluido','desligado')),
  data_conclusao TIMESTAMPTZ,
  whatsapp_validado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_alunos_whatsapp ON alunos(whatsapp);
CREATE INDEX idx_alunos_user_id ON alunos(user_id);
CREATE INDEX idx_alunos_indicador ON alunos(indicador_id);
CREATE INDEX idx_alunos_status ON alunos(status);

-- MÓDULOS
CREATE TABLE modulos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ordem INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  capa_url TEXT,
  publicado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_modulos_ordem ON modulos(ordem);
CREATE INDEX idx_modulos_publicado ON modulos(publicado) WHERE publicado = TRUE;

-- AULAS
CREATE TABLE aulas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  modulo_id UUID NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  youtube_video_id TEXT NOT NULL,
  duracao_minutos INTEGER,
  capa_url TEXT,
  quiz_qtd_questoes INTEGER NOT NULL DEFAULT 5 CHECK (quiz_qtd_questoes BETWEEN 1 AND 20),
  quiz_aprovacao_minima INTEGER NOT NULL DEFAULT 80 CHECK (quiz_aprovacao_minima BETWEEN 50 AND 100),
  quiz_max_tentativas INTEGER,
  espera_horas INTEGER NOT NULL DEFAULT 24 CHECK (espera_horas >= 0),
  publicado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_aulas_modulo_ordem ON aulas(modulo_id, ordem);
CREATE INDEX idx_aulas_publicado ON aulas(publicado) WHERE publicado = TRUE;

-- QUESTÕES
CREATE TABLE questoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  enunciado TEXT NOT NULL,
  alternativas JSONB NOT NULL,
  explicacao TEXT,
  ativa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT alternativas_validas CHECK (jsonb_array_length(alternativas) BETWEEN 2 AND 6)
);
CREATE INDEX idx_questoes_aula ON questoes(aula_id) WHERE ativa = TRUE;

-- PROGRESSO (cada tentativa de quiz vira 1 linha)
CREATE TABLE progresso (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  tentativa_numero INTEGER NOT NULL DEFAULT 1,
  acertos INTEGER NOT NULL,
  total_questoes INTEGER NOT NULL,
  percentual NUMERIC(5,2) NOT NULL,
  aprovado BOOLEAN NOT NULL,
  respostas JSONB,
  proxima_aula_liberada_em TIMESTAMPTZ,
  whatsapp_notificado BOOLEAN DEFAULT FALSE,
  whatsapp_notificado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_progresso_aluno ON progresso(aluno_id);
CREATE INDEX idx_progresso_aula ON progresso(aula_id);
CREATE INDEX idx_progresso_aluno_aula ON progresso(aluno_id, aula_id);
CREATE INDEX idx_progresso_pendente_notif ON progresso(proxima_aula_liberada_em)
  WHERE aprovado = TRUE AND whatsapp_notificado = FALSE;

-- ADMINS
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','super_admin')),
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_admins_user ON admins(user_id) WHERE ativo = TRUE;

-- CONFIGURAÇÕES
CREATE TABLE configuracoes (
  chave TEXT PRIMARY KEY,
  valor JSONB NOT NULL,
  descricao TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO configuracoes (chave, valor, descricao) VALUES
  ('evolution_api_url', '"https://sua-evolution.com"'::jsonb, 'URL Evolution API'),
  ('evolution_api_instance', '"avp-uniavp"'::jsonb, 'Instância'),
  ('mensagem_aula_liberada', '"🎓 Olá {nome}! Sua próxima aula na Uni AVP está liberada. Acesse: {link}"'::jsonb, 'Template ao liberar aula'),
  ('mensagem_conclusao', '"🎉 Parabéns {nome}! Você concluiu a Uni AVP. Fale com {indicador_nome}: {link}"'::jsonb, 'Template ao concluir');

-- TRIGGERS
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_indicadores BEFORE UPDATE ON indicadores FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_alunos BEFORE UPDATE ON alunos FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_modulos BEFORE UPDATE ON modulos FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_aulas BEFORE UPDATE ON aulas FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_questoes BEFORE UPDATE ON questoes FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_configuracoes BEFORE UPDATE ON configuracoes FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- IS_ADMIN
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admins WHERE user_id = check_user_id AND ativo = TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRILHA DO ALUNO (controla progressão linear com lock 24h)
CREATE OR REPLACE FUNCTION obter_trilha_aluno(p_aluno_id UUID)
RETURNS TABLE (
  modulo_id UUID, modulo_ordem INTEGER, modulo_titulo TEXT,
  aula_id UUID, aula_ordem INTEGER, aula_titulo TEXT, aula_descricao TEXT,
  duracao_minutos INTEGER, capa_url TEXT, youtube_video_id TEXT,
  status TEXT, melhor_percentual NUMERIC, liberada_em TIMESTAMPTZ
) AS $$
DECLARE
  v_ultima_aprovada_em TIMESTAMPTZ;
  v_proxima_liberada_em TIMESTAMPTZ;
  v_proxima_aula_id UUID;
BEGIN
  SELECT p.created_at, p.proxima_aula_liberada_em INTO v_ultima_aprovada_em, v_proxima_liberada_em
  FROM progresso p WHERE p.aluno_id = p_aluno_id AND p.aprovado = TRUE
  ORDER BY p.created_at DESC LIMIT 1;

  SELECT a.id INTO v_proxima_aula_id
  FROM aulas a JOIN modulos m ON m.id = a.modulo_id
  WHERE a.publicado = TRUE AND m.publicado = TRUE
    AND NOT EXISTS (SELECT 1 FROM progresso p2 WHERE p2.aluno_id = p_aluno_id AND p2.aula_id = a.id AND p2.aprovado = TRUE)
  ORDER BY m.ordem, a.ordem LIMIT 1;

  RETURN QUERY
  SELECT m.id, m.ordem, m.titulo, a.id, a.ordem, a.titulo, a.descricao,
    a.duracao_minutos, a.capa_url, a.youtube_video_id,
    CASE
      WHEN EXISTS (SELECT 1 FROM progresso p WHERE p.aluno_id = p_aluno_id AND p.aula_id = a.id AND p.aprovado = TRUE) THEN 'concluida'
      WHEN a.id = v_proxima_aula_id THEN
        CASE
          WHEN v_ultima_aprovada_em IS NULL THEN 'disponivel'
          WHEN v_proxima_liberada_em IS NULL OR v_proxima_liberada_em <= NOW() THEN 'disponivel'
          ELSE 'aguardando_tempo'
        END
      ELSE 'bloqueada'
    END AS status,
    (SELECT MAX(p.percentual) FROM progresso p WHERE p.aluno_id = p_aluno_id AND p.aula_id = a.id) AS melhor_percentual,
    CASE WHEN a.id = v_proxima_aula_id AND v_proxima_liberada_em > NOW() THEN v_proxima_liberada_em ELSE NULL END AS liberada_em
  FROM aulas a JOIN modulos m ON m.id = a.modulo_id
  WHERE a.publicado = TRUE AND m.publicado = TRUE
  ORDER BY m.ordem, a.ordem;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ROW LEVEL SECURITY
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE questoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE progresso ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alunos veem proprio cadastro" ON alunos FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Alunos atualizam proprio cadastro" ON alunos FOR UPDATE USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Admins gerenciam alunos" ON alunos FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Permitir cadastro publico" ON alunos FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Modulos publicados visiveis" ON modulos FOR SELECT USING (publicado = TRUE OR is_admin(auth.uid()));
CREATE POLICY "Admins gerenciam modulos" ON modulos FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Aulas publicadas visiveis" ON aulas FOR SELECT USING (publicado = TRUE OR is_admin(auth.uid()));
CREATE POLICY "Admins gerenciam aulas" ON aulas FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Questoes visiveis autenticados" ON questoes FOR SELECT USING (auth.uid() IS NOT NULL AND ativa = TRUE);
CREATE POLICY "Admins gerenciam questoes" ON questoes FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Aluno ve proprio progresso" ON progresso FOR SELECT
  USING (aluno_id IN (SELECT id FROM alunos WHERE user_id = auth.uid()) OR is_admin(auth.uid()));
CREATE POLICY "Aluno cria proprio progresso" ON progresso FOR INSERT
  WITH CHECK (aluno_id IN (SELECT id FROM alunos WHERE user_id = auth.uid()));
CREATE POLICY "Admins gerenciam progresso" ON progresso FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Indicadores ativos publicos" ON indicadores FOR SELECT USING (ativo = TRUE OR is_admin(auth.uid()));
CREATE POLICY "Admins gerenciam indicadores" ON indicadores FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admin ve proprio cadastro" ON admins FOR SELECT USING (user_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "Admins gerenciam admins" ON admins FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admins gerenciam configuracoes" ON configuracoes FOR ALL USING (is_admin(auth.uid()));

-- SEEDS
INSERT INTO indicadores (nome, tipo, whatsapp, email) VALUES
  ('Jefferson Soares', 'gestor', '5587999999999', 'jefferson@autovaleprevencoes.org.br');

INSERT INTO modulos (ordem, titulo, descricao, publicado) VALUES
  (1, 'Boas-vindas & Cultura AVP', 'História, valores e código de conduta da Auto Vale Prevenções.', TRUE),
  (2, 'Abertura e Gestão de Sinistros', 'Fluxo completo de atendimento ao associado.', TRUE),
  (3, 'Vendas, Pós-Venda e Retenção', 'Técnicas comerciais consultivas.', TRUE);
