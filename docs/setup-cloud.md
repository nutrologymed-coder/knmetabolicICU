# Configuração de nuvem (ações que exigem humano)

O repositório contém **um único workflow** (`ci.yml`, só em PRs), `_headers`, migrações e testes. Política: **uso mínimo de GitHub Actions**; deploy e previews ficam com o Cloudflare Pages (Git integration), sem minutos de Actions. Estes passos **dependem de credenciais/decisões suas** e não foram executados.

## 1. GitHub
1. Settings → Branches → regra para `main`: exigir PR, status check `check` (CI), review de Code Owners, histórico linear, bloquear force-push.
2. Settings → Code security: habilitar Dependabot **alerts** (sem workflow), secret scanning, push protection e CodeQL em *default setup* (opcional; agendado pelo GitHub, sem arquivo no repo).
3. Settings → Actions → General: permissões padrão do `GITHUB_TOKEN` = somente leitura; exigir aprovação para workflows de fork.

## 2. Cloudflare Pages
1. Cloudflare → Workers & Pages → Create → **Connect to Git** → este repositório.
2. Build command: `npm run build`; output directory: `dist`; production branch: `main`. Branches/PRs geram *previews* automaticamente.
3. Nenhum token da Cloudflare fica no GitHub (nada a vazar). Variáveis de ambiente, se houver, só no painel da Cloudflare.
4. Domínio próprio, HTTPS "Full (strict)", HSTS, regra de rate limiting e WAF gerenciado.
5. Em *Settings → Builds*, ative *Branch control* para só `main` ser produção. Conferir após o deploy: `curl -sI https://<dominio> | grep -i -E "content-security|strict-transport"`.

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
