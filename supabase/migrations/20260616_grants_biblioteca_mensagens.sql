-- Cria tabela biblioteca (conteúdo digital: audiobooks, vídeos, PDFs por tenant)
CREATE TABLE IF NOT EXISTS biblioteca (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES clientes(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  autor       TEXT,
  descricao   TEXT,
  url         TEXT NOT NULL,
  tipo        TEXT DEFAULT 'drive',
  capa_url    TEXT,
  categoria   TEXT DEFAULT 'Audiobook',
  plano       TEXT DEFAULT 'pro',
  duracao     TEXT,
  ordem       INT DEFAULT 0,
  ativo       BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_biblioteca_tenant ON biblioteca(tenant_id);

ALTER TABLE biblioteca ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_direct" ON biblioteca FOR ALL USING (false);

-- Cria tabela mensagens_log (deduplica mensagens WhatsApp já enviadas)
CREATE TABLE IF NOT EXISTS mensagens_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario  TEXT NOT NULL,
  chave         TEXT NOT NULL,
  tenant_id     UUID REFERENCES clientes(id) ON DELETE SET NULL,
  enviado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_log_lookup
  ON mensagens_log(destinatario, chave, tenant_id, enviado_em);

ALTER TABLE mensagens_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_direct" ON mensagens_log FOR ALL USING (false);

-- Expõe as tabelas ao PostgREST via service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON biblioteca   TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON mensagens_log TO service_role;
