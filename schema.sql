-- YFM Finance: tabelas, regras de acesso (RLS), histórico de alterações e lixeira.
-- Cole este arquivo inteiro em Supabase > SQL Editor > New query > Run.
-- Pode ser executado de novo sem problema (serve também para atualizar uma versão anterior).

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  s0 numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  email text,
  role text not null check (role in ('admin','cliente')),
  company_id uuid references companies(id) on delete set null
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  d date not null check (d between date '2000-01-01' and date '2100-12-31'),
  n text not null check (char_length(n) between 1 and 80),
  c text not null check (c in ('Receita de vendas','Impostos sobre vendas','CMV','Despesa com pessoal','Despesa administrativa','Despesa financeira')),
  v numeric(14,2) not null check (v > 0 and v < 1000000000),
  t text not null check (t in ('in','out')),
  s text not null check (s in ('pago','pendente')),
  created_at timestamptz not null default now()
);
alter table transactions add column if not exists deleted_at timestamptz;  -- lixeira (exclusão lógica)
create index if not exists transactions_company_idx on transactions (company_id, d);

create table if not exists audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid,
  action text not null,
  tabela text not null,
  row_id text,
  company_id uuid,
  detail jsonb
);

alter table companies    enable row level security;
alter table profiles     enable row level security;
alter table transactions enable row level security;
alter table audit_log    enable row level security;

-- O administrador só tem poderes quando a sessão passou pela verificação em duas etapas (aal2).
create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where user_id = auth.uid() and role = 'admin')
     and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
$$;

create or replace function public.my_company() returns uuid
language sql security definer stable set search_path = public as $$
  select company_id from profiles where user_id = auth.uid()
$$;

-- profiles: cada um lê o próprio; só o administrador (com 2FA) cria/altera/apaga
drop policy if exists profiles_ler on profiles;
create policy profiles_ler on profiles for select to authenticated
  using (user_id = auth.uid() or is_admin());
drop policy if exists profiles_admin on profiles;
create policy profiles_admin on profiles for all to authenticated
  using (is_admin()) with check (is_admin());

-- companies: administrador faz tudo; cliente só lê a sua
drop policy if exists companies_admin on companies;
create policy companies_admin on companies for all to authenticated
  using (is_admin()) with check (is_admin());
drop policy if exists companies_cliente on companies;
create policy companies_cliente on companies for select to authenticated
  using (id = my_company());

-- transactions: ninguém apaga pelo site (só envia para a lixeira com UPDATE)
drop policy if exists transactions_admin on transactions;
drop policy if exists transactions_cliente on transactions;
drop policy if exists tx_admin_sel on transactions;
drop policy if exists tx_admin_ins on transactions;
drop policy if exists tx_admin_upd on transactions;
drop policy if exists tx_cliente on transactions;
create policy tx_admin_sel on transactions for select to authenticated using (is_admin());
create policy tx_admin_ins on transactions for insert to authenticated with check (is_admin());
create policy tx_admin_upd on transactions for update to authenticated using (is_admin()) with check (is_admin());
create policy tx_cliente   on transactions for select to authenticated
  using (company_id = my_company() and deleted_at is null);

-- audit_log: só o administrador lê; ninguém grava, edita ou apaga pelo site (só os gatilhos abaixo)
drop policy if exists audit_admin on audit_log;
create policy audit_admin on audit_log for select to authenticated using (is_admin());

create or replace function public.log_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare r jsonb; cid uuid;
begin
  if tg_op = 'DELETE' then r := to_jsonb(old); else r := to_jsonb(new); end if;
  if tg_op = 'UPDATE' then
    r := r || jsonb_build_object('_antes_na_lixeira', (to_jsonb(old) ->> 'deleted_at') is not null);
  end if;
  cid := case tg_table_name
           when 'companies' then (r ->> 'id')::uuid
           else nullif(r ->> 'company_id', '')::uuid
         end;
  insert into audit_log (actor, action, tabela, row_id, company_id, detail)
  values (auth.uid(), tg_op, tg_table_name, coalesce(r ->> 'id', r ->> 'user_id'), cid, r - 'created_at');
  return null;
end $$;

drop trigger if exists audit_transactions on transactions;
create trigger audit_transactions after insert or update or delete on transactions
  for each row execute function public.log_change();
drop trigger if exists audit_companies on companies;
create trigger audit_companies after insert or update or delete on companies
  for each row execute function public.log_change();
drop trigger if exists audit_profiles on profiles;
create trigger audit_profiles after insert or update or delete on profiles
  for each row execute function public.log_change();
