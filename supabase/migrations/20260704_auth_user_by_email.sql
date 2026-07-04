-- Busca um usuário na tabela auth.users pelo e-mail.
-- Necessário porque o client JS não expõe getUserByEmail no admin API,
-- e a alternativa (paginar listUsers) quebra acima de ~20k usuários.
-- SECURITY DEFINER permite acesso ao schema auth sem expor a tabela via PostgREST.

CREATE OR REPLACE FUNCTION public.auth_user_by_email(p_email text)
RETURNS TABLE (id uuid, email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT id, email FROM auth.users WHERE email = p_email LIMIT 1;
$$;

-- Apenas o service role pode chamar esta função
REVOKE ALL ON FUNCTION public.auth_user_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_user_by_email(text) TO service_role;
