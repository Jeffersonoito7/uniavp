-- Adiciona campos de sobreposição de texto nos templates de arte
ALTER TABLE artes_templates
  ADD COLUMN IF NOT EXISTS texto_ativo      BOOLEAN  DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS texto_template   TEXT     DEFAULT '{nome}',
  ADD COLUMN IF NOT EXISTS texto_x          NUMERIC  DEFAULT 50,
  ADD COLUMN IF NOT EXISTS texto_y          NUMERIC  DEFAULT 85,
  ADD COLUMN IF NOT EXISTS texto_tamanho    NUMERIC  DEFAULT 5,
  ADD COLUMN IF NOT EXISTS texto_cor        TEXT     DEFAULT '#FFFFFF',
  ADD COLUMN IF NOT EXISTS texto_negrito    BOOLEAN  DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS texto_alinhamento TEXT    DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS texto_sombra     BOOLEAN  DEFAULT TRUE;
