-- ================================================================
-- MIGRAÇÃO: Multi-Tenancy White-Label
-- Execute no Supabase SQL Editor
-- ================================================================

-- 1. Tabela de mapeamento domínio → tenant
CREATE TABLE IF NOT EXISTS tenant_domains (
  domain TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Adiciona tenant_id em todas as tabelas de dados
ALTER TABLE admins           ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES clientes(id) ON DELETE CASCADE;
ALTER TABLE configuracoes    ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES clientes(id) ON DELETE CASCADE;
ALTER TABLE modulos          ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES clientes(id) ON DELETE CASCADE;
ALTER TABLE aulas            ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES clientes(id) ON DELETE CASCADE;
ALTER TABLE alunos           ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES clientes(id) ON DELETE CASCADE;
ALTER TABLE gestores         ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES clientes(id) ON DELETE CASCADE;
ALTER TABLE progresso        ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES clientes(id) ON DELETE CASCADE;
ALTER TABLE indicadores      ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES clientes(id) ON DELETE CASCADE;
ALTER TABLE gestor_pagamentos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES clientes(id) ON DELETE CASCADE;
ALTER TABLE artes_templates  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES clientes(id) ON DELETE CASCADE;
ALTER TABLE contratos        ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES clientes(id) ON DELETE CASCADE;
ALTER TABLE cncpv_registros  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES clientes(id) ON DELETE CASCADE;

-- 3. Cria o tenant da AVP (primeiro cliente)
INSERT INTO clientes (nome, dominio, ativo, contato_nome, gestor_ativo, limite_consultores)
SELECT 'Auto Vale Prevenções', 'uniavp.autovaleprevencoes.org.br', true, 'Auto Vale', true, 9999
WHERE NOT EXISTS (
  SELECT 1 FROM clientes WHERE dominio = 'uniavp.autovaleprevencoes.org.br'
);

-- 4. Registra os domínios da AVP
DO $$
DECLARE
  avp_id UUID;
BEGIN
  SELECT id INTO avp_id FROM clientes WHERE dominio = 'uniavp.autovaleprevencoes.org.br' LIMIT 1;
  IF avp_id IS NULL THEN
    SELECT id INTO avp_id FROM clientes ORDER BY created_at LIMIT 1;
  END IF;

  INSERT INTO tenant_domains (domain, tenant_id) VALUES
    ('uniavp.autovaleprevencoes.org.br', avp_id),
    ('adm.autovaleprevencoes.org.br', avp_id),
    ('universidade.oito7digital.com.br', avp_id)
  ON CONFLICT (domain) DO NOTHING;

  -- Migra todos os dados existentes para o tenant da AVP
  UPDATE admins            SET tenant_id = avp_id WHERE tenant_id IS NULL;
  UPDATE configuracoes     SET tenant_id = avp_id WHERE tenant_id IS NULL;
  UPDATE modulos           SET tenant_id = avp_id WHERE tenant_id IS NULL;
  UPDATE aulas             SET tenant_id = avp_id WHERE tenant_id IS NULL;
  UPDATE alunos            SET tenant_id = avp_id WHERE tenant_id IS NULL;
  UPDATE gestores          SET tenant_id = avp_id WHERE tenant_id IS NULL;
  UPDATE progresso         SET tenant_id = avp_id WHERE tenant_id IS NULL;
  UPDATE indicadores       SET tenant_id = avp_id WHERE tenant_id IS NULL;
  UPDATE gestor_pagamentos SET tenant_id = avp_id WHERE tenant_id IS NULL;
  UPDATE artes_templates   SET tenant_id = avp_id WHERE tenant_id IS NULL;
  UPDATE contratos         SET tenant_id = avp_id WHERE tenant_id IS NULL;
  UPDATE cncpv_registros   SET tenant_id = avp_id WHERE tenant_id IS NULL;
END $$;

-- 5. Índices de performance
CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant  ON tenant_domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_configuracoes_tenant   ON configuracoes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_modulos_tenant         ON modulos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_aulas_tenant           ON aulas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alunos_tenant          ON alunos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gestores_tenant        ON gestores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_progresso_tenant       ON progresso(tenant_id);
CREATE INDEX IF NOT EXISTS idx_indicadores_tenant     ON indicadores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gestor_pagamentos_tenant ON gestor_pagamentos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_artes_templates_tenant ON artes_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contratos_tenant       ON contratos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cncpv_registros_tenant ON cncpv_registros(tenant_id);
CREATE INDEX IF NOT EXISTS idx_admins_tenant          ON admins(tenant_id);
