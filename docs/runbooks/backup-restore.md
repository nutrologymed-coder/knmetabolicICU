# Runbook: backup e restauração (Supabase)

Pré-requisito: plano com backups diários e/ou **PITR** habilitado no projeto de produção.

## Teste trimestral de restauração (obrigatório antes de produção com dados reais)
1. Restaurar o backup/PITR em um **projeto novo de teste** (nunca sobre o prod).
2. Rodar `scripts/test-db.sh`-equivalente: conferir que RLS está ativa (`select relname, relrowsecurity, relforcerowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r';`).
3. Conferir contagens de `calculations` e `audit_log` com o prod no horário-alvo.
4. Registrar data, duração (RTO) e perda de dados (RPO) abaixo; apagar o projeto de teste.

## Restauração real
1. Declarar incidente; congelar deploys.
2. Restaurar para o ponto no tempo anterior ao problema; validar RLS e dados.
3. Reaplicar migrações posteriores se houver (`supabase db push`).
4. Trocar chaves/URL no front somente se um novo projeto foi criado.

## Exclusão e backups (LGPD)
Dados eliminados permanecem em backups até expirarem (informar na política de privacidade); em restauração, **reaplicar exclusões pendentes** antes de reabrir o serviço.

| Data | RTO | RPO | Responsável |
|---|---|---|---|
| (nenhum teste executado ainda) | | | |
