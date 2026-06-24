-- Adiciona flag especialista na tabela alunos
-- Quando true: bypass de bloqueio de video e quiz obrigatorio
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS especialista boolean NOT NULL DEFAULT false;
