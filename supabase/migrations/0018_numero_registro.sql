-- Adiciona numero_registro e data_formacao na tabela alunos
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS numero_registro INTEGER UNIQUE;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS data_formacao DATE;

-- Índice para buscar o próximo número rapidamente
CREATE INDEX IF NOT EXISTS idx_alunos_numero_registro ON alunos(numero_registro);
