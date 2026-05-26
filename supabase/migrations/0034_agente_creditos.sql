-- ── Configuração do agente IA por tenant ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS agente_config (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id       UUID REFERENCES clientes(id) ON DELETE CASCADE,
  nome_assistente TEXT NOT NULL DEFAULT 'Assistente',
  instancia_whatsapp TEXT,              -- número/instância da Evolution API
  prompt_extra    TEXT,                 -- contexto adicional do negócio
  modelo          TEXT NOT NULL DEFAULT 'haiku' CHECK (modelo IN ('haiku', 'sonnet')),
  creditos_boas_vindas INT NOT NULL DEFAULT 50,  -- créditos grátis ao ativar PRO
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id)
);

-- ── Argumentos competitivos (editável pelo admin do tenant) ───────────────────
CREATE TABLE IF NOT EXISTS agente_argumentos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   UUID REFERENCES clientes(id) ON DELETE CASCADE,
  categoria   TEXT NOT NULL,            -- ex: "preco", "cobertura", "atendimento"
  argumento   TEXT NOT NULL,
  ordem       INT NOT NULL DEFAULT 0,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agente_argumentos_tenant ON agente_argumentos(tenant_id, ativo);

-- ── Pacotes de créditos (editável pelo admin do tenant) ───────────────────────
CREATE TABLE IF NOT EXISTS agente_pacotes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   UUID REFERENCES clientes(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,            -- ex: "Básico", "Profissional", "Elite"
  creditos    INT NOT NULL,             -- quantidade de créditos
  valor       DECIMAL(10,2) NOT NULL,   -- preço em reais
  ordem       INT NOT NULL DEFAULT 0,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agente_pacotes_tenant ON agente_pacotes(tenant_id, ativo);

-- ── Saldo de créditos por gestor ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agente_creditos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gestor_id   UUID REFERENCES gestores(id) ON DELETE CASCADE NOT NULL,
  tenant_id   UUID REFERENCES clientes(id) ON DELETE CASCADE,
  saldo       INT NOT NULL DEFAULT 0 CHECK (saldo >= 0),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (gestor_id)
);
CREATE INDEX IF NOT EXISTS idx_agente_creditos_gestor ON agente_creditos(gestor_id);

-- ── Histórico de transações de crédito ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS agente_transacoes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gestor_id   UUID REFERENCES gestores(id) ON DELETE CASCADE NOT NULL,
  tenant_id   UUID REFERENCES clientes(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL CHECK (tipo IN ('compra', 'uso', 'bonus', 'estorno')),
  creditos    INT NOT NULL,             -- positivo = entrada, negativo = saída
  valor_pago  DECIMAL(10,2),           -- preenchido apenas em compras
  cobranca_id TEXT,                    -- txid do PIX (compras)
  descricao   TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agente_transacoes_gestor ON agente_transacoes(gestor_id);
CREATE INDEX IF NOT EXISTS idx_agente_transacoes_cobranca ON agente_transacoes(cobranca_id);

-- ── Recargas PIX pendentes do agente ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agente_recargas (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gestor_id   UUID REFERENCES gestores(id) ON DELETE CASCADE NOT NULL,
  tenant_id   UUID REFERENCES clientes(id) ON DELETE CASCADE,
  pacote_id   UUID REFERENCES agente_pacotes(id),
  creditos    INT NOT NULL,
  valor       DECIMAL(10,2) NOT NULL,
  txid        TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'expirado')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  pago_em     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_agente_recargas_txid ON agente_recargas(txid);
CREATE INDEX IF NOT EXISTS idx_agente_recargas_gestor ON agente_recargas(gestor_id, status);

-- ── Sessão de conversa do agente (estado entre mensagens WhatsApp) ────────────
CREATE TABLE IF NOT EXISTS agente_sessoes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gestor_id   UUID REFERENCES gestores(id) ON DELETE CASCADE NOT NULL,
  estado      TEXT NOT NULL,            -- ex: 'recarregar_escolha_pacote', 'comparar_aguardando_autovale'
  dados       JSONB NOT NULL DEFAULT '{}',
  expires_at  TIMESTAMPTZ NOT NULL,     -- sessão expira em 30 min
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (gestor_id)
);
CREATE INDEX IF NOT EXISTS idx_agente_sessoes_gestor ON agente_sessoes(gestor_id);

-- ── Custo por ação (configurável no agente_config) ────────────────────────────
-- Comentário de referência — os valores padrão ficam no código:
-- mensagem simples (haiku)   = 1 crédito
-- resumo financeiro (haiku)  = 1 crédito
-- script de vendas (sonnet)  = 3 créditos
-- comparar cotações (sonnet) = 5 créditos
