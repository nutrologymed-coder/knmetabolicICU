# Segurança

## Modelo de ameaças (resumo)
| Ameaça | Mitigação |
|---|---|
| XSS / injeção de script | CSP `script-src 'self'`, sem inline; testes impedem script inline/remoto; saídas escapadas (`esc()` em `calculators.js`) |
| Clickjacking | `frame-ancestors 'none'`, `X-Frame-Options: DENY` |
| Comprometimento da cadeia de suprimentos | Dependências vendorizadas; ações do GitHub fixadas por SHA; Dependabot; CodeQL; sem CDN em runtime |
| Vazamento de segredos | Sem segredos no repo; guarda no CI; GitHub secret scanning + push protection; segredos só em GitHub/Cloudflare/Supabase |
| Acesso indevido a dados | RLS forçada, grants mínimos, MFA, testes pgTAP |
| Adulteração de resultados do deploy | Deploy só de `main` com ambiente `production` (aprovação manual) |
| Negação de serviço/abuso | Cloudflare WAF/rate limiting (configurar), Turnstile em formulários futuros |

## Controles do repositório
- `.github/workflows`: permissões `contents: read` por padrão, `persist-credentials: false`, `concurrency`, timeouts, fork PRs sem segredos.
- `.github/CODEOWNERS`: revisão obrigatória em lógica clínica, banco, headers e workflows.

## Endurecimento a configurar na plataforma (ver [setup-cloud.md](setup-cloud.md))
- Branch protection em `main`: PR obrigatório, CI verde, review de CODEOWNERS, histórico linear, sem force-push.
- Secret scanning + push protection, Dependabot alerts, code scanning.
- 2FA obrigatório na organização e contas Cloudflare/Supabase; tokens com escopo mínimo e expiração.

## Divulgação de vulnerabilidades
Ver `SECURITY.md` na raiz.
