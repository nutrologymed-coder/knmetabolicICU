# Release e rollback

## Versionamento
- Site: SemVer em `package.json`. Fórmulas: mudança de qualquer cálculo ⇒ **minor/major** e entrada no changelog clínico abaixo.
- Atualizar `CACHE` em `sw.js` (ex.: `knmetabolicuti-v6`) em todo release que altere arquivos pré-cacheados.

## Fluxo
1. PR com checklist (template) → CI + CodeQL verdes → review de Code Owner.
2. Merge em `main` → `deploy.yml` aguarda aprovação do ambiente `production`.
3. Pós-deploy: abrir o site, executar 3 cálculos de referência (IMC, FIB-4, SOFA) e conferir cabeçalhos de segurança.
4. Criar tag/release (`git tag vX.Y.Z`) e registrar changelog.

## Rollback
- **Front:** no painel Cloudflare Pages → Deployments → "Rollback" para o deploy anterior (imediato); depois reverter o commit no GitHub (`git revert`).
- **Service worker:** se clientes ficaram com cache ruim, publicar novo `CACHE` com versão superior.
- **Banco:** migrações são aditivas; para reverter, criar migração corretiva (nunca editar migração já aplicada). Dados: ver runbook de backup.

## Changelog clínico
| Versão | Data | Mudança | Revisores |
|---|---|---|---|
| 0.1.0 | 2026-11-16 | 20 calculadoras iniciais (`pending_review`) | pendente |
