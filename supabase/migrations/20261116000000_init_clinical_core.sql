-- Core schema. Principles: least privilege, RLS on every table, no direct patient identifiers,
-- append-only audit trail. Design notes: docs/adr/0003-data-model-and-rls.md

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 120),
  preferred_lang text not null default 'pt' check (preferred_lang in ('pt', 'en')),
  consented_at timestamptz,            -- LGPD: consent to store calculation history
  created_at timestamptz not null default now()
);

create table public.calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  calculator_id text not null check (calculator_id ~ '^[a-z0-9_]{1,40}$'),
  formula_version text not null check (char_length(formula_version) <= 40),
  -- Pseudonymous label chosen by the clinician. Do NOT store name, CPF or other direct identifiers.
  patient_ref text check (char_length(patient_ref) <= 40),
  inputs jsonb not null check (pg_column_size(inputs) <= 8192),
  outputs jsonb not null check (pg_column_size(outputs) <= 8192),
  created_at timestamptz not null default now()
);
create index calculations_user_created_idx on public.calculations (user_id, created_at desc);

create table public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.calculations enable row level security;
alter table public.audit_log enable row level security;
alter table public.profiles force row level security;
alter table public.calculations force row level security;
alter table public.audit_log force row level security;

create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_delete_own on public.profiles for delete to authenticated using (id = auth.uid());

create policy calc_select_own on public.calculations for select to authenticated using (user_id = auth.uid());
create policy calc_insert_own on public.calculations for insert to authenticated with check (user_id = auth.uid());
create policy calc_delete_own on public.calculations for delete to authenticated using (user_id = auth.uid());
-- No UPDATE policy on calculations: results are immutable; recalculate and insert a new row.

-- Users may read their own audit trail; nobody can write it directly (only SECURITY DEFINER triggers).
create policy audit_select_own on public.audit_log for select to authenticated using (user_id = auth.uid());

-- Least privilege at the grant level (defense in depth on top of RLS).
revoke all on public.profiles, public.calculations, public.audit_log from anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, delete on public.calculations to authenticated;
grant select on public.audit_log to authenticated;

create function public.audit_calculation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (user_id, action, entity, entity_id) values (new.user_id, 'insert', 'calculation', new.id::text);
    return new;
  else
    -- Skip when the account itself is being erased (cascade): its audit rows are anonymised instead.
    if exists (select 1 from auth.users where id = old.user_id) then
      insert into public.audit_log (user_id, action, entity, entity_id) values (old.user_id, 'delete', 'calculation', old.id::text);
    end if;
    return old;
  end if;
end $$;
revoke all on function public.audit_calculation() from public;

create trigger calculations_audit after insert or delete on public.calculations
  for each row execute function public.audit_calculation();

-- Audit log is append-only, even for privileged roles (except account erasure, handled by user_id nulling below).
create function public.audit_log_immutable() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' and old.user_id is not null and new.user_id is null
     and (new.id, new.action, new.entity, new.entity_id, new.at) is not distinct from (old.id, old.action, old.entity, old.entity_id, old.at) then
    return new;  -- LGPD erasure: anonymise only
  end if;
  raise exception 'audit_log is append-only';
end $$;
create trigger audit_log_no_change before update or delete on public.audit_log
  for each row execute function public.audit_log_immutable();

-- LGPD erasure: when an account is deleted, anonymise its audit rows instead of keeping the identifier.
create function public.anonymise_audit_on_user_delete() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.audit_log set user_id = null where user_id = old.id;
  return old;
end $$;
revoke all on function public.anonymise_audit_on_user_delete() from public;

-- Named with a zz_ prefix so it fires after the FK cascade triggers of the same statement.
create trigger zz_anonymise_audit after delete on auth.users
  for each row execute function public.anonymise_audit_on_user_delete();
