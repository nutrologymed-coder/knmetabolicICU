-- Minimal stand-in for the Supabase-managed roles/auth schema so migrations and pgTAP tests run on plain Postgres in CI.
-- Production/staging use the real Supabase stack; keep auth.uid() semantics identical to Supabase.
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$; do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
create schema auth;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(coalesce(current_setting('request.jwt.claim.sub', true), (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;
create extension if not exists pgtap;
