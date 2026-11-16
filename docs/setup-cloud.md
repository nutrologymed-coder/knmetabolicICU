# Configuração de nuvem (ações que exigem humano)

O repositório já contém workflows, `_headers`, migrações e testes. Estes passos **dependem de credenciais/decisões suas** e não foram executados.

## 1. GitHub
1. Settings → Branches → regra para `main`: exigir PR, status checks `test` e `database` (CI) e `analyze` (CodeQL), review de Code Owners, histórico linear, bloquear force-push.
2. Settings → Code security: habilitar Dependabot alerts/updates, secret scanning e push protection, code scanning.
3. Settings → Environments → criar `production` com **required reviewers**.
4. Settings → Actions → General: permissões padrão do `GITHUB_TOKEN` = somente leitura; exigir aprovação para workflows de fork.

## 2. Cloudflare Pages
1. Criar projeto Pages chamado `knmetabolic` (Direct Upload; o deploy vem do GitHub Actions).
2. Criar API token com escopo mínimo: *Account → Cloudflare Pages → Edit*, restrito à conta e com expiração.
3. Em GitHub → Settings → Secrets (de preferência no environment `production`): `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`.
4. Domínio próprio, HTTPS "Full (strict)", HSTS, regra de rate limiting e WAF gerenciado.
5. Conferir após o deploy: `curl -sI https://<dominio> | grep -i -E "content-security|strict-transport"`.

Sem os secrets, os workflows de deploy/preview **pulam** a publicação com um aviso (não falham).

## 3. Supabase (somente quando o checklist de [lgpd.md](lgpd.md) estiver completo)
1. Criar dois projetos: `knmetabolic-staging` e `knmetabolic-prod` (região conforme análise jurídica).
2. Auth: confirmar e-mail, senha ≥ 12, MFA TOTP, desabilitar login anônimo; configurar redirect URLs.
3. Aplicar migrações: `supabase link --project-ref <ref>` e `supabase db push` (primeiro em staging).
4. Habilitar **backups diários e PITR** (plano pago) no prod; executar o teste de restauração em [runbooks/backup-restore.md](runbooks/backup-restore.md).
5. No front só entram a URL e a chave `anon`/publishable; **`service_role` nunca** vai ao navegador nem ao repositório.

## 4. Verificação local
```
npm test && npm run build      # front + registro de validação
scripts/test-db.sh             # migrações + pgTAP (precisa de Postgres local com pgtap)
```
