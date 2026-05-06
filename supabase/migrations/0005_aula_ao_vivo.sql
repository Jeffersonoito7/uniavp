ALTER TABLE aulas ADD COLUMN IF NOT EXISTS ao_vivo_link TEXT;
ALTER TABLE aulas ADD COLUMN IF NOT EXISTS ao_vivo_data TIMESTAMPTZ;
ALTER TABLE aulas ADD COLUMN IF NOT EXISTS ao_vivo_plataforma TEXT CHECK (ao_vivo_plataforma IN ('zoom','meet','teams','outro'));
