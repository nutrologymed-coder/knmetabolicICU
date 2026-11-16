## O que mudou
<!-- Resumo curto -->

## Checklist geral
- [ ] `npm test` passa e `npm run build` funciona
- [ ] Sem segredos, dados de pacientes ou identificadores diretos no código/testes
- [ ] Documentação atualizada, se aplicável

## Checklist clínico (alterações em `js/scores.js` ou `validation/`)
- [ ] Fonte primária citada e `validation/registry.json` atualizado
- [ ] Unidades, faixas plausíveis e arredondamento conferidos
- [ ] Casos de teste com valores publicados adicionados
- [ ] Duas revisões clínicas antes de marcar `reviewed` (ver `docs/clinical-safety.md`)

## Checklist de banco/segurança (alterações em `supabase/`, `_headers`, workflows)
- [ ] Toda tabela nova tem RLS habilitada e forçada + teste pgTAP
- [ ] Migração é aditiva/reversível; plano de rollback descrito
- [ ] Ações de terceiros fixadas por SHA
