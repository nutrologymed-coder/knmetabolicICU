# ROADMAP: mapa do projeto, do início ao fim

> **Se você (coder) se perdeu, comece aqui.** Este é o documento mestre. Regras de uso:
> 1. Trabalhe **uma fase por vez**, na ordem. Não pule fases bloqueantes (🔒).
> 2. Ao terminar um item, marque `[x]` **no mesmo PR** que o implementa e preencha a coluna "Evidência" (link do PR/commit/teste).
> 3. Uma fase só é "concluída" quando todos os itens estão `[x]` **e** o *Gate* da fase passou. Atualize o quadro de status abaixo.
> 4. Nunca marque `[x]` sem evidência verificável. Item que depende de decisão/credencial humana: marque `[!]` (bloqueado) e escreva quem decide.
> 5. Antes de começar: `npm test && npm run build` deve passar. Se CI estiver vermelho, conserte primeiro.
> 6. **Política de GitHub Actions: mínimo essencial.** Um único workflow (`ci.yml`, só em PR). Não adicione workflows/cron/matrizes sem ADR justificando o custo. Deploy/preview = Cloudflare Git integration.
> 7. Proibido: dados reais de pacientes em código/testes/issues; segredos no repositório; ligar o banco ao front antes da Fase 5; marcar fórmula como `reviewed` sem 2 revisores clínicos.

Legenda: `[ ]` pendente · `[~]` em andamento · `[x]` concluído (com evidência) · `[!]` bloqueado por humano

## Quadro de status

| Fase | Nome | Estado | Gate |
|---|---|---|---|
| 0 | Fundamentos e governança | 🟡 parcial | decisões regulatórias |
| 1 | Núcleo clínico e qualidade | 🟡 parcial | 2 revisões clínicas por fórmula |
| 2 | Front-end, UX e acessibilidade | 🟡 parcial | WCAG AA + E2E |
| 3 | Infra Cloudflare | ⚪ não iniciada | site em produção com headers |
| 4 | Supabase/PostgreSQL (staging) | 🟡 parcial (schema pronto) | pgTAP verde no CI |
| 5 | 🔒 Conformidade e dados de paciente | ⚪ bloqueada | RIPD + jurídico |
| 6 | CI/CD e supply chain | 🟡 parcial | CI verde + branch protection |
| 7 | Segurança clínica contínua | 🟡 parcial | hazard log sem risco aberto alto |
| 8 | Observabilidade e operação | ⚪ não iniciada | alertas + runbooks testados |
| 9 | Integrações (API, npm, WhatsApp) | ⚪ não iniciada | ADR + RIPD por integração |
| 10 | Lançamento e governança | ⚪ não iniciada | beta fechado aprovado |

Ordem recomendada de execução: **6 → 1 → 2 → 3 → 0 (decisões em paralelo) → 4 → 5 → 7/8 → 9 → 10**. Versão pública *sem login e sem dados de paciente* pode sair após Fases 1, 2, 3 e 6.

---

## Fase 0: Fundamentos e governança
**Objetivo:** decisões, papéis e enquadramento regulatório documentados.

| | Item | Evidência |
|---|---|---|
| [x] | ADRs 0001-0003 (stack, sem dados de paciente, modelo de dados/RLS) | `docs/adr/` (PR #8) |
| [x] | Documentos guia (arquitetura, segurança, LGPD, release, runbooks) | `docs/` (PR #8) |
| [ ] | Nomear responsável clínico, responsável técnico e DPO | quem decide: dono do projeto |
| [ ] | Parecer regulatório: enquadramento SaMD (Anvisa RDC 657/2022) e alegações permitidas | quem decide: assessoria regulatória |
| [ ] | Escolher licença do código (hoje `UNLICENSED` em `package.json`) e licenças/direitos de escalas usadas | quem decide: dono |
| [ ] | Decidir monorepo (`packages/scores` publicável) ou repositório único | novo ADR 0004 |

**Gate 0:** parecer regulatório recebido e responsáveis nomeados antes de qualquer alegação clínica ou comercialização.

## Fase 1: Núcleo clínico e qualidade
**Objetivo:** cada fórmula correta, rastreável e revisada.

| | Item | Evidência |
|---|---|---|
| [x] | 20 calculadoras com testes e registro de validação (`pending_review`) | `js/scores.js`, `validation/registry.json` |
| [x] | CI falha se calculadora sem fonte/estado ou `reviewed` com < 2 revisores | `tests/registry.test.js` |
| [ ] | Vetores de teste **publicados** (artigo/diretriz) para cada calculadora, não só cálculo próprio | cada PR cita a fonte |
| [ ] | Testes de fronteira nos limiares (arredondamento só na exibição; H8) | `tests/` |
| [ ] | Conversor/validação explícita de unidades (mg/dL ↔ mmol/L etc.; H1) | PR |
| [ ] | Critérios de aplicabilidade por calculadora (população, exclusões; H3) exibidos na UI | PR |
| [ ] | Exibir fonte e versão da fórmula em cada resultado | PR |
| [!] | **Revisão clínica dupla** de cada calculadora → `status: reviewed` + `reviewers` | quem decide: 2 clínicos |
| [ ] | Novas calculadoras (ex.: Harris-Benedict, NRS-2002, APACHE II, CHA₂DS₂-VASc, Wells) só com fonte e licença da escala verificadas | PR por calculadora |
| [ ] | Versionar `scores.js` (SemVer) e preencher o changelog clínico em `docs/release.md` | release |

**Gate 1:** nenhuma calculadora pública sem `reviewed`, ou com aviso visível de "não validada clinicamente".

## Fase 2: Front-end, UX e acessibilidade
| | Item | Evidência |
|---|---|---|
| [x] | Página de calculadoras com Pico.css, busca, visões por especialidade/A–Z/doença, favoritos, link direto | PRs #5, #6, #7 |
| [ ] | Migrar `index.html` ao mesmo design system | PR |
| [ ] | Idioma PT/EN compartilhado entre as páginas | PR |
| [ ] | Acessibilidade WCAG AA (foco, contraste, `aria-live` no resultado, leitor de tela) | auditoria + PR |
| [ ] | Testes E2E com Playwright (cálculo, busca, favoritos, offline), rodados localmente; só entram no CI se o custo for baixo | `tests/e2e/` |
| [ ] | Aviso "nova versão disponível" do service worker (H6) | PR |
| [ ] | Exportação PDF/CSV dos resultados das calculadoras | PR |
| [ ] | Auditoria Lighthouse (PWA/a11y) executada localmente antes de releases | registro |

**Gate 2:** E2E e a11y verdes no CI.

## Fase 3: Infra Cloudflare
| | Item | Evidência |
|---|---|---|
| [x] | `_headers` (CSP estrita, HSTS, frame-ancestors none) + `dist/` só com arquivos públicos | PR #8 |
| [x] | Política de Actions mínimo: deploy/preview via Cloudflare Git integration, sem workflows nem tokens no GitHub | `docs/setup-cloud.md` §2 |
| [!] | Conectar o repositório ao Cloudflare Pages (build `npm run build`, saída `dist`, produção só `main`) | `docs/setup-cloud.md` §2 |
| [!] | Domínio próprio, HTTPS "Full (strict)", WAF gerenciado, rate limiting | dono |
| [ ] | Conferir headers em produção (`curl -sI`) e registrar resultado | aqui |
| [ ] | Infra como código (`wrangler.toml`/Terraform) para o que for configurável | PR |
| [ ] | (Só se houver API) Worker com validação de entrada, CORS restrito e Turnstile | ADR + PR |

**Gate 3:** site em produção com CSP/HSTS verificados e rollback testado (`docs/release.md`).

## Fase 4: Supabase/PostgreSQL
| | Item | Evidência |
|---|---|---|
| [x] | Migração inicial: RLS forçada, grants mínimos, `calculations` imutável, `audit_log` append-only, eliminação LGPD | `supabase/migrations/` |
| [x] | 16 testes pgTAP locais verdes | `scripts/test-db.sh` |
| [ ] | pgTAP verde **no CI** (roda quando `supabase/` muda) | job `check` |
| [!] | Criar projetos `staging` e `prod` separados; região conforme jurídico | `docs/setup-cloud.md` §3 |
| [!] | Auth: confirmação de e-mail, senha ≥ 12, MFA TOTP, sem login anônimo | painel + `config.toml` |
| [ ] | Validar o schema contra o **Supabase real** (`supabase db reset` + `supabase test db`), pois o CI usa um bootstrap simulado | evidência no PR |
| [ ] | Exportação de dados do titular (JSON/CSV) e exclusão de conta testadas | testes |
| [ ] | Retenção automática (ex.: 12 meses) via job agendado | migração |
| [!] | Backups diários + PITR no prod e **teste de restauração** | `runbooks/backup-restore.md` |

**Gate 4:** migrações aplicadas em staging, RLS verificada, restauração testada.

## Fase 5: 🔒 Conformidade e dados de paciente
**Bloqueante:** nada de coleta real ou ligação do banco ao front antes do Gate 5.

| | Item | Evidência |
|---|---|---|
| [ ] | RIPD concluído e aprovado | doc + jurídico |
| [ ] | Base legal e texto de consentimento (dados de saúde, art. 11) | jurídico |
| [ ] | Política de privacidade/termos; DPAs com Supabase e Cloudflare; transferência internacional | jurídico |
| [ ] | Fluxo de consentimento no app gravando `profiles.consented_at` | PR + teste |
| [ ] | Cliente Supabase no front com **somente** chave anon/publishable; revisão de que `service_role` nunca aparece (guarda do CI) | PR |
| [ ] | Atualizar a CSP (`connect-src`) só para o domínio Supabase exato | `_headers` |
| [ ] | Teste de eliminação e portabilidade ponta a ponta | testes |

**Gate 5:** checklist de `docs/lgpd.md` 100% marcado e aprovado por jurídico/DPO.

## Fase 6: CI/CD e supply chain
| | Item | Evidência |
|---|---|---|
| [x] | **Único** workflow `ci.yml` (só PR: testes, build, guarda de segredos, pgTAP condicional), ações fixadas por SHA | PR #8 |
| [~] | CI verde no GitHub (ubuntu-24.04; pgTAP só roda se `supabase/` mudar) | conferir `gh pr checks` |
| [!] | Branch protection em `main` (PR, check `check`, CODEOWNERS, histórico linear, sem force-push) | `docs/setup-cloud.md` §1 |
| [!] | Habilitar secret scanning, push protection, Dependabot alerts e (opcional) CodeQL default setup, tudo sem workflows | Settings |
| [ ] | Tags assinadas; SBOM gerado manualmente/local só em releases (evitar workflow extra) | release |
| [ ] | Atualizar Pico.css vendorizado de forma controlada (checksum registrado) | doc |

**Gate 6:** `main` protegida e todos os checks obrigatórios verdes.

## Fase 7: Segurança clínica contínua
| | Item | Evidência |
|---|---|---|
| [x] | Hazard log inicial H1-H8 e processo de validação | `docs/clinical-safety.md` |
| [ ] | Fechar controles pendentes do hazard log (cada um vira item/PR) | tabela atualizada |
| [ ] | Revisão semestral das fórmulas e das diretrizes de origem (agenda recorrente) | calendário/issue recorrente |
| [ ] | Exercício do runbook de erro clínico (simulação) | registro |
| [ ] | Linguagem da UI revisada por clínico (H5: apoio ≠ conduta) | PR |

## Fase 8: Observabilidade e operação
| | Item | Evidência |
|---|---|---|
| [ ] | Monitor de disponibilidade e alerta (sem dados pessoais) | config |
| [ ] | Relatórios de erro (ex.: Sentry) com *scrubbing*; nunca enviar entradas clínicas | PR + teste |
| [ ] | SLOs e runbooks testados (`security-incident`, `backup-restore`, `clinical-error`) | registros |
| [ ] | Custos/limites (Cloudflare, Supabase) monitorados | painel |

## Fase 9: Integrações
Cada integração exige **ADR + RIPD (se tocar dados) + threat model** antes do código.

| | Item | Evidência |
|---|---|---|
| [ ] | Pacote reutilizável `@knmetabolic/scores` (npm privado/público) para os outros repositórios | ADR + release |
| [ ] | API pública versionada, com *rate limit* e validação de esquema | ADR + PR |
| [ ] | Bot WhatsApp (Meta Cloud API) via Worker, com revisão humana e LGPD aplicada | ADR + RIPD |
| [ ] | FHIR/HL7 apenas se houver demanda real | ADR |

## Fase 10: Lançamento e governança
| | Item | Evidência |
|---|---|---|
| [ ] | Beta fechado com profissionais; coleta de feedback sem dados de pacientes | relatório |
| [ ] | Critérios de saída do beta (zero erro clínico aberto, a11y, desempenho) | checklist |
| [ ] | Política de suporte e versionamento público; changelog clínico publicado | docs |
| [ ] | Revisão semestral de segurança, privacidade e licenças | agenda |

---

## Como retomar rapidamente (checklist de "me perdi")
1. `git pull && npm test && npm run build`: tudo verde?
2. `gh pr checks <PR>`: CI verde? Se não, corrigir antes de qualquer feature.
3. Abra o quadro de status acima; pegue o **primeiro item `[ ]` da menor fase não concluída** (respeitando a ordem recomendada).
4. Leia o documento ligado ao item (`docs/clinical-safety.md`, `lgpd.md`, `security.md`, `setup-cloud.md`, `release.md`).
5. Implemente com testes → PR usando o template → marque `[x]` + evidência no mesmo PR.
6. Item que exige humano (`[!]`): não tente contornar; descreva no PR/issue o que falta e siga para outro item desbloqueado.

## Regras de proteção (não negociáveis)
- Todo PR passa por `npm test`, build e CI; mudanças em `js/scores.js`, `validation/`, `supabase/`, `_headers`, `.github/` exigem review de Code Owner.
- Migração nova: aditiva, com RLS forçada + teste pgTAP; nunca editar migração já aplicada.
- Fórmula alterada ⇒ teste novo, fonte no registro, changelog clínico e bump de `CACHE` do `sw.js`.
- Qualquer mudança de CSP deve manter `script-src 'self'` (sem inline, sem CDN).
- Erro clínico reportado ⇒ seguir `docs/runbooks/clinical-error.md` (48 h).
