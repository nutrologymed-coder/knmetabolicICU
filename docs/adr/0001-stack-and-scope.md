# ADR 0001: Stack e escopo

**Estado:** aceito

## Decisão
- Front estático sem build, hospedado em Cloudflare Pages (custo baixo, CDN, headers de segurança, previews por PR).
- Supabase (Auth + PostgreSQL com RLS) para persistência futura; GitHub Actions para CI/CD.
- Produto posicionado como **apoio ao cálculo**, sem diagnóstico ou conduta automática, para permanecer fora de classes de risco mais altas de SaMD. O enquadramento definitivo na RDC 657/2022 (Anvisa) deve ser confirmado por assessoria regulatória **antes** de qualquer alegação clínica ou comercialização.

## Consequências
- Sem servidor próprio no início: superfície de ataque menor.
- Segurança do front depende de CSP estrita (`script-src 'self'`, sem scripts inline; verificado por `tests/static.test.js`).
- Dependências de terceiros são vendorizadas (ex.: Pico.css) para funcionar offline e evitar CDN em runtime.
