# ADR 0003: Modelo de dados e RLS

**Estado:** aceito. Implementação: `supabase/migrations/20261116000000_init_clinical_core.sql`. Testes: `supabase/tests/rls.test.sql` (14 asserções).

## Regras
- **RLS habilitada e forçada** em toda tabela de `public`; políticas por `auth.uid()`.
- **Privilégio mínimo em dois níveis:** `revoke all` de `anon`/`authenticated` + `grant` explícito (RLS não é a única barreira).
- `calculations` é **imutável** (sem UPDATE): recalcular gera nova linha, preservando `formula_version` para rastreabilidade.
- `audit_log` é **append-only**: escrita só por triggers `SECURITY DEFINER`; UPDATE/DELETE bloqueados por trigger, exceto a anonimização do `user_id` na exclusão da conta (LGPD).
- Restrições: formato de `calculator_id`, tamanho máximo de `inputs`/`outputs`/`patient_ref`.
- `ON DELETE CASCADE` a partir de `auth.users` garante o direito de eliminação.

## Regras para novas migrações
Aditivas e reversíveis; tabela nova sem RLS + teste pgTAP **não passa no CI**. Nunca expor `service_role` ao navegador.
