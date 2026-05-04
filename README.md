# 🎓 Uni AVP — Universidade Auto Vale Prevenções

Plataforma de formação interna. **Stack:** Next.js 14 + Supabase + TypeScript + Tailwind.

## 📋 Status

- ✅ **Fase 1** — Setup + Banco + Auth (esta entrega)
- ⏳ Fase 2 — Front completo (Home Netflix, Player, Admin CRUD)
- ⏳ Fase 3 — WhatsApp Evolution API + Deploy

## 🚀 Setup (15 min)

### 1. Supabase
1. Crie projeto em https://supabase.com (região São Paulo, plano Free)
2. SQL Editor → New query → cole TODO o `supabase/migrations/0001_schema_inicial.sql` → Run
3. Settings → API → copie URL, anon key e service_role key

### 2. Configurar local
```bash
npm install
cp .env.example .env.local
# Edite .env.local com as chaves do Supabase
npm run dev
```
Abra http://localhost:3000

### 3. Criar primeiro admin
1. Cadastre-se em http://localhost:3000/cadastro com email `jefferson@autovaleprevencoes.org.br`
2. No SQL Editor do Supabase rode:
```sql
INSERT INTO admins (user_id, nome, email, role)
SELECT id, 'Jefferson Soares', email, 'super_admin'
FROM auth.users WHERE email = 'jefferson@autovaleprevencoes.org.br';
```
3. Logout/login → será redirecionado a /admin ✅

## 🧪 Testes

- `/cadastro` cria aluno + WhatsApp único
- `/aluno/{whatsapp}` mostra dados
- `/admin` mostra contadores
- Tentativa de acesso não-autenticado → redireciona /login

## 🆘 Problemas comuns

- **"function obter_trilha_aluno does not exist"** → não rodou o SQL. Refaça etapa 1.2.
- **"Invalid API key"** → chaves do `.env.local` incompletas. Recopie do Supabase.
- **Erro Module not found** → `rm -rf node_modules .next && npm install`

## 📂 Estrutura

```
app/login | app/cadastro | app/aluno/[whatsapp] | app/admin
app/api/cadastro/route.ts
lib/supabase-{client,server}.ts | lib/database.types.ts
supabase/migrations/0001_schema_inicial.sql
middleware.ts (proteção de rotas)
```
