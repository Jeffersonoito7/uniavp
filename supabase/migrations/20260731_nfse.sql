-- Configuração NFS-e do super admin (Oito7 Digital)
create table if not exists nfse_config (
  id text primary key default 'default',
  url_servico text,
  cnpj text,
  inscricao_municipal text,
  item_lista_servico text,
  aliquota_iss numeric(5,4),
  optante_simples boolean default true,
  incentivador_cultural boolean default false,
  codigo_municipio_ibge text,
  serie_rps text default '1',
  descricao_servico text,
  rps_seq integer default 0,
  cert_enc text,
  cert_pass_enc text,
  cert_valido_ate timestamptz,
  cert_titular text,
  cert_configurado boolean default false,
  ambiente text default 'homologacao',
  codigo_tributacao_municipio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into nfse_config (id) values ('default') on conflict (id) do nothing;

-- Notas emitidas
create table if not exists nfse_notas (
  id uuid primary key default gen_random_uuid(),
  numero text,
  codigo_verificacao text,
  valor numeric(10,2),
  descricao text,
  tomador jsonb,
  tomador_doc text,
  tomador_nome text,
  item text,
  aliquota text,
  status text default 'ativa',
  rps integer,
  xml text,
  data timestamptz default now()
);

create index if not exists idx_nfse_notas_data on nfse_notas(data desc);
create index if not exists idx_nfse_notas_status on nfse_notas(status);

-- Tomadores salvos
create table if not exists nfse_tomadores (
  id uuid primary key default gen_random_uuid(),
  documento text not null unique,
  tipo text,
  razao_social text,
  email text,
  logradouro text,
  numero_end text,
  complemento text,
  bairro text,
  municipio text,
  codigo_ibge text,
  uf text,
  cep text,
  created_at timestamptz default now()
);

create index if not exists idx_nfse_tomadores_doc on nfse_tomadores(documento);

-- RLS: apenas service role acessa (super admin usa service role key nas APIs)
alter table nfse_config enable row level security;
alter table nfse_notas enable row level security;
alter table nfse_tomadores enable row level security;
