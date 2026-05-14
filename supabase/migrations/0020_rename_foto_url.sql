-- Renomeia foto_url para foto_perfil se ainda não foi renomeada
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'alunos' AND column_name = 'foto_url'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'alunos' AND column_name = 'foto_perfil'
  ) THEN
    ALTER TABLE alunos RENAME COLUMN foto_url TO foto_perfil;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'alunos' AND column_name = 'foto_perfil'
  ) THEN
    ALTER TABLE alunos ADD COLUMN foto_perfil TEXT;
  END IF;
END $$;
