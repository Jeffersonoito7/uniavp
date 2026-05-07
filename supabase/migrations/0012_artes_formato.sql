ALTER TABLE artes_templates ADD COLUMN IF NOT EXISTS formato TEXT DEFAULT 'feed';

UPDATE artes_templates SET formato = 'feed' WHERE formato IS NULL;

INSERT INTO artes_templates (tipo, titulo, formato) VALUES
  ('boas_vindas_stories', 'Boas-vindas (Stories)',          'stories'),
  ('10_placas_stories',   'Parabéns - 10 Placas (Stories)', 'stories'),
  ('15_placas_stories',   'Parabéns - 15 Placas (Stories)', 'stories'),
  ('20_placas_stories',   'Parabéns - 20 Placas (Stories)', 'stories'),
  ('25_placas_stories',   'Parabéns - 25 Placas (Stories)', 'stories'),
  ('30_placas_stories',   'Parabéns - 30 Placas (Stories)', 'stories'),
  ('novo_gestor_stories', 'Parabéns - Novo Gestor (Stories)','stories')
ON CONFLICT (tipo) DO NOTHING;
