create table if not exists cobrancas_pix (
  id uuid primary key default gen_random_uuid(),
  txid text not null unique,
  valor numeric(10,2) not null,
  descricao text,
  vencimento date not null,
  devedor_nome text,
  devedor_doc text,
  qr_code text,
  copia_e_cola text,
  status text default 'ATIVA',
  valor_pago numeric(10,2),
  pago_em timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_cobrancas_pix_status on cobrancas_pix(status);
create index if not exists idx_cobrancas_pix_created on cobrancas_pix(created_at desc);

alter table cobrancas_pix enable row level security;
