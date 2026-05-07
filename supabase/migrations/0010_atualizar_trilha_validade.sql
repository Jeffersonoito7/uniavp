CREATE OR REPLACE FUNCTION obter_trilha_aluno(p_aluno_id UUID)
RETURNS TABLE (
  modulo_id UUID, modulo_ordem INTEGER, modulo_titulo TEXT,
  aula_id UUID, aula_ordem INTEGER, aula_titulo TEXT, aula_descricao TEXT,
  duracao_minutos INTEGER, capa_url TEXT, youtube_video_id TEXT,
  status TEXT, melhor_percentual NUMERIC, liberada_em TIMESTAMPTZ,
  validade_meses INTEGER, progresso_created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_ultima_aprovada_em TIMESTAMPTZ;
  v_proxima_liberada_em TIMESTAMPTZ;
  v_proxima_aula_id UUID;
BEGIN
  SELECT p.created_at, p.proxima_aula_liberada_em INTO v_ultima_aprovada_em, v_proxima_liberada_em
  FROM progresso p WHERE p.aluno_id = p_aluno_id AND p.aprovado = TRUE
  ORDER BY p.created_at DESC LIMIT 1;

  SELECT a.id INTO v_proxima_aula_id
  FROM aulas a JOIN modulos m ON m.id = a.modulo_id
  WHERE a.publicado = TRUE AND m.publicado = TRUE
    AND NOT EXISTS (SELECT 1 FROM progresso p2 WHERE p2.aluno_id = p_aluno_id AND p2.aula_id = a.id AND p2.aprovado = TRUE)
  ORDER BY m.ordem, a.ordem LIMIT 1;

  RETURN QUERY
  SELECT m.id, m.ordem, m.titulo, a.id, a.ordem, a.titulo, a.descricao,
    a.duracao_minutos, a.capa_url, a.youtube_video_id,
    CASE
      WHEN EXISTS (SELECT 1 FROM progresso p WHERE p.aluno_id = p_aluno_id AND p.aula_id = a.id AND p.aprovado = TRUE) THEN 'concluida'
      WHEN a.id = v_proxima_aula_id THEN
        CASE
          WHEN v_ultima_aprovada_em IS NULL THEN 'disponivel'
          WHEN v_proxima_liberada_em IS NULL OR v_proxima_liberada_em <= NOW() THEN 'disponivel'
          ELSE 'aguardando_tempo'
        END
      ELSE 'bloqueada'
    END AS status,
    (SELECT MAX(p.percentual) FROM progresso p WHERE p.aluno_id = p_aluno_id AND p.aula_id = a.id) AS melhor_percentual,
    CASE WHEN a.id = v_proxima_aula_id AND v_proxima_liberada_em > NOW() THEN v_proxima_liberada_em ELSE NULL END AS liberada_em,
    a.validade_meses,
    (SELECT p.created_at FROM progresso p WHERE p.aluno_id = p_aluno_id AND p.aula_id = a.id AND p.aprovado = TRUE ORDER BY p.created_at ASC LIMIT 1) AS progresso_created_at
  FROM aulas a JOIN modulos m ON m.id = a.modulo_id
  WHERE a.publicado = TRUE AND m.publicado = TRUE
  ORDER BY m.ordem, a.ordem;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
