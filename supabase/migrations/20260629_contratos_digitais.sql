-- ============================================================
-- MODULO CONTRATOS DIGITAIS
-- Templates, instancias, assinantes e gatilhos automaticos
-- ============================================================

-- Templates de contrato (admin cria/edita/arquiva)
CREATE TABLE IF NOT EXISTS public.contrato_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  descricao     TEXT,
  corpo_html    TEXT NOT NULL DEFAULT '',
  variaveis     JSONB NOT NULL DEFAULT '[]',
  ativo         BOOLEAN NOT NULL DEFAULT true,
  arquivado     BOOLEAN NOT NULL DEFAULT false,
  criado_por    UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contratos gerados (principal ou aditivo)
CREATE TABLE IF NOT EXISTS public.contratos_digitais (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  template_id          UUID REFERENCES public.contrato_templates(id),
  contrato_base_id     UUID REFERENCES public.contratos_digitais(id),
  tipo                 TEXT NOT NULL DEFAULT 'principal',
  titulo               TEXT NOT NULL,
  numero_registro      TEXT NOT NULL,
  corpo_renderizado    TEXT NOT NULL DEFAULT '',
  variaveis_usadas     JSONB NOT NULL DEFAULT '{}',
  status               TEXT NOT NULL DEFAULT 'rascunho',
  hash_final           TEXT,
  pdf_url              TEXT,
  assinatura_avp_url   TEXT,
  assinado_avp_em      TIMESTAMPTZ,
  gatilho_tipo         TEXT,
  gatilho_ref_id       UUID,
  criado_por           UUID,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assinantes de cada contrato
CREATE TABLE IF NOT EXISTS public.contrato_assinantes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id       UUID NOT NULL REFERENCES public.contratos_digitais(id) ON DELETE CASCADE,
  ordem             SMALLINT NOT NULL DEFAULT 1,
  papel             TEXT NOT NULL DEFAULT 'destinatario',
  nome              TEXT NOT NULL,
  email             TEXT,
  whatsapp          TEXT,
  cpf               TEXT,
  token_acesso      TEXT UNIQUE,
  token_expira_em   TIMESTAMPTZ,
  status            TEXT NOT NULL DEFAULT 'pendente',
  assinatura_url    TEXT,
  ip_assinatura     TEXT,
  assinado_em       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Gatilhos automaticos (template X dispara ao concluir modulo/curso)
CREATE TABLE IF NOT EXISTS public.contrato_gatilhos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  template_id     UUID NOT NULL REFERENCES public.contrato_templates(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL DEFAULT 'curso_completo',
  ref_id          UUID,
  ativo           BOOLEAN NOT NULL DEFAULT true,
  variaveis_fixas JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_contratos_digitais_tenant   ON public.contratos_digitais(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contratos_digitais_status   ON public.contratos_digitais(status);
CREATE INDEX IF NOT EXISTS idx_contrato_assinantes_token   ON public.contrato_assinantes(token_acesso);
CREATE INDEX IF NOT EXISTS idx_contrato_assinantes_contrato ON public.contrato_assinantes(contrato_id);
CREATE INDEX IF NOT EXISTS idx_contrato_templates_tenant    ON public.contrato_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contrato_gatilhos_tenant     ON public.contrato_gatilhos(tenant_id);

-- RLS (service role bypassa em todas as rotas de API)
ALTER TABLE public.contrato_templates   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_digitais   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_assinantes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_gatilhos    ENABLE ROW LEVEL SECURITY;

-- Trigger updated_at
CREATE TRIGGER set_updated_at_contrato_templates
  BEFORE UPDATE ON public.contrato_templates
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_contratos_digitais
  BEFORE UPDATE ON public.contratos_digitais
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
