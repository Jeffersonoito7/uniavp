-- Streaks de estudo no perfil do aluno
ALTER TABLE alunos
  ADD COLUMN IF NOT EXISTS streak_atual INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS maior_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultimo_estudo_em DATE;

-- Índice para o cron de inatividade
CREATE INDEX IF NOT EXISTS idx_alunos_ultimo_estudo ON alunos(ultimo_estudo_em) WHERE status = 'ativo';
