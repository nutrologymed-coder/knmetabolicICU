# Arquitetura

```
Navegador (PWA estática, offline) ──► Cloudflare Pages (dist/ + _headers: CSP, HSTS…)
        │  (fase futura, após checklist LGPD)
        └──► Supabase Auth + PostgreSQL (RLS) ──► audit_log append-only
```

## Componentes
- **Front-end:** HTML/CSS/JS sem build (Pico.css vendorizado). Todo cálculo roda **no cliente**; nenhuma entrada clínica sai do dispositivo hoje.
- **Biblioteca de cálculo:** `js/scores.js` (UMD, pura, sem DOM), reutilizável por outros repositórios e testada em Node.
- **Registro de validação:** `validation/registry.json`; o CI falha se uma calculadora não tiver fonte/estado.
- **Build:** `scripts/build.mjs` copia só arquivos públicos para `dist/` (testes, docs e `supabase/` nunca são publicados).
- **Banco:** `supabase/migrations` + testes pgTAP em `supabase/tests`; harness de CI em `supabase/ci` e `scripts/test-db.sh`.

## Ambientes
| Ambiente | Front | Banco | Deploy |
|---|---|---|---|
| local | `npm run build && npm run preview` | `supabase start` | manual |
| preview (PR) | Cloudflare Pages branch preview | projeto *staging* | Cloudflare Git integration |
| produção | Cloudflare Pages `main` | projeto *prod* (PITR ligado) | Cloudflare Git integration (branch `main`) |

Projetos Supabase de staging e prod são **separados**; nunca apontar preview para prod.

## Fora do escopo atual (decisão deliberada)
Cloudflare Workers/API, WhatsApp, FHIR e login no front-end. Entram só após: revisão clínica das fórmulas, RIPD concluído e checklist de [setup-cloud.md](setup-cloud.md).
