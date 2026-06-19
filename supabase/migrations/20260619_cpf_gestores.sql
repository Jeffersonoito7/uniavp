-- Adiciona coluna cpf na tabela gestores
ALTER TABLE gestores ADD COLUMN IF NOT EXISTS cpf text;
