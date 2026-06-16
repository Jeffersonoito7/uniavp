-- Expõe biblioteca e mensagens_log ao PostgREST para que apareçam na geração de tipos
GRANT SELECT, INSERT, UPDATE, DELETE ON biblioteca TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON biblioteca TO service_role;
GRANT ALL ON biblioteca TO postgres;

GRANT SELECT, INSERT, UPDATE, DELETE ON mensagens_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON mensagens_log TO service_role;
GRANT ALL ON mensagens_log TO postgres;
