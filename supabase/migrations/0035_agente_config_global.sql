-- Configuração global do Agente IA (Oito7 nível)
-- Usada como fallback quando o tenant não tem config própria

create table if not exists agente_config_global (
  id              uuid primary key default gen_random_uuid(),
  nome_assistente text        not null default 'Assistente',
  prompt_base     text        null,
  modelo_padrao   text        not null default 'haiku',
  creditos_boas_vindas_padrao int not null default 50,
  ativo           boolean     not null default true,
  criado_por      text        null,
  updated_at      timestamptz not null default now()
);

-- Insere registro único (singleton)
insert into agente_config_global (nome_assistente, prompt_base, modelo_padrao, creditos_boas_vindas_padrao)
values (
  'Assistente AutoVale',
  'Você é um assistente especialista em proteção veicular. Seu papel é ajudar consultores e líderes de equipe a venderem mais e melhor. Seja objetivo, positivo e focado em resultados. Quando comparar com concorrentes, sempre destaque os diferenciais da AutoVale com dados e argumentos concretos.',
  'haiku',
  50
)
on conflict do nothing;

-- RLS
alter table agente_config_global enable row level security;
create policy "service_role_all" on agente_config_global for all to service_role using (true) with check (true);
