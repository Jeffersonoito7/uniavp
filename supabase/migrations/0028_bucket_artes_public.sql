-- Torna o bucket 'artes' público (leitura sem autenticação)
UPDATE storage.buckets SET public = true WHERE id = 'artes';

-- Policy de leitura pública para o bucket artes
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
  'Leitura pública artes',
  'artes',
  'SELECT',
  'true'
)
ON CONFLICT DO NOTHING;
