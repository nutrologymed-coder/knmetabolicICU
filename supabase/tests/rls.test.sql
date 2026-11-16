-- pgTAP: RLS and immutability guarantees. Run: supabase test db
begin;
select plan(14);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@example.test');

select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.calculations'::regclass), 'calculations: RLS enabled and forced');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles: RLS enabled and forced');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.audit_log'::regclass), 'audit_log: RLS enabled and forced');

-- Alice
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
insert into public.calculations (calculator_id, formula_version, inputs, outputs)
values ('bmi', '1.0.0', '{"wt":70,"ht":170}', '{"bmi":24.2}');
select is((select count(*)::int from public.calculations), 1, 'alice sees her calculation');
select is((select count(*)::int from public.audit_log), 1, 'insert was audited and visible to its owner');
select throws_ok($$update public.calculations set outputs = '{}'$$, '42501', null, 'calculations are immutable (no UPDATE grant)');
select throws_ok($$insert into public.audit_log (action, entity) values ('x', 'y')$$, '42501', null, 'clients cannot write the audit log');
select throws_ok($$delete from public.audit_log$$, '42501', null, 'clients cannot delete the audit log');
select throws_ok($$insert into public.calculations (calculator_id, formula_version, inputs, outputs) values ('Bad Id!', '1', '{}', '{}')$$, '23514', null, 'calculator_id format enforced');

-- Bob
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*)::int from public.calculations), 0, 'bob cannot see alice''s calculations');
select is((select count(*)::int from public.audit_log), 0, 'bob cannot see alice''s audit trail');
select throws_ok(
  $$insert into public.calculations (user_id, calculator_id, formula_version, inputs, outputs)
    values ('00000000-0000-0000-0000-00000000000a', 'bmi', '1.0.0', '{}', '{}')$$,
  '42501', null, 'bob cannot insert rows as alice');

-- Anonymous
reset role;
set local role anon;
select throws_ok($$select count(*) from public.calculations$$, '42501', null, 'anon has no access');

reset role;
-- LGPD erasure: deleting the account removes data and anonymises the audit trail
delete from auth.users where id = '00000000-0000-0000-0000-00000000000a';
select is((select count(*)::int from public.audit_log where user_id is not null), 0, 'audit rows anonymised after account deletion');

select * from finish();
rollback;
