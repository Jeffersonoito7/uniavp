-- Remove duplicatas: mantém só a última linha por chave
DELETE FROM configuracoes
WHERE id NOT IN (
  SELECT DISTINCT ON (chave) id
  FROM configuracoes
  ORDER BY chave, id DESC
);

-- Adiciona constraint única na coluna chave (necessário para upsert funcionar)
ALTER TABLE configuracoes
  ADD CONSTRAINT configuracoes_chave_unique UNIQUE (chave);
