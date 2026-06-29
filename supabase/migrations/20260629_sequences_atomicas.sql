-- Sequences atomicas para evitar race condition em numeros sequenciais

-- Sequence para numero de contrato digital (formato: CD{ano}{seq})
CREATE SEQUENCE IF NOT EXISTS contrato_numero_seq START 1;

-- Sequence para numero de registro de aluno (certificado)
-- Começa a partir do maior numero_registro existente + 1
DO $$
DECLARE
  v_max INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero_registro), 1000) INTO v_max FROM alunos;
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS aluno_numero_registro_seq START %s', v_max + 1);
END $$;

-- Adiciona UNIQUE em numero_registro de contratos_digitais (se ainda nao existir)
ALTER TABLE contratos_digitais
  ALTER COLUMN numero_registro SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contratos_digitais_numero_registro_key'
  ) THEN
    ALTER TABLE contratos_digitais ADD CONSTRAINT contratos_digitais_numero_registro_key UNIQUE (numero_registro);
  END IF;
END $$;

-- Funcao que gera o proximo numero de contrato de forma atomica
CREATE OR REPLACE FUNCTION gerar_numero_contrato(p_tenant_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seq  BIGINT;
  v_ano  TEXT;
BEGIN
  v_seq := nextval('contrato_numero_seq');
  v_ano := to_char(NOW(), 'YYYY');
  RETURN 'CD' || v_ano || lpad(v_seq::TEXT, 4, '0');
END;
$$;

-- Funcao que gera o proximo numero de registro de aluno de forma atomica
CREATE OR REPLACE FUNCTION gerar_numero_registro_aluno()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN nextval('aluno_numero_registro_seq')::INTEGER;
END;
$$;
