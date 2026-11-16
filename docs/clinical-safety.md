# Segurança clínica

Objetivo: impedir que um erro de software leve a decisão clínica inadequada. Inspirado em ISO 14971 (simplificado). O produto é **apoio ao cálculo**; não substitui julgamento clínico.

## Processo de validação de uma fórmula
1. Identificar a **fonte primária** (artigo/diretriz), versão e população de aplicação; registrar em `validation/registry.json`.
2. Implementar em `js/scores.js` com unidades explícitas e faixas plausíveis (`min`/`max` dos campos).
3. Testes em `tests/scores.test.js` com **valores publicados** ou calculados à mão de forma independente.
4. **Duas revisões clínicas independentes**; só então `status: "reviewed"` com `reviewers` (o CI exige ≥ 2).
5. Release com changelog clínico (ver [release.md](release.md)). Mudança de fórmula ⇒ nova versão e reavaliação.

Estado atual: **todas as 20 calculadoras estão `pending_review`**. O app deve ser tratado como não validado clinicamente até a revisão.

## Hazard log
| # | Perigo | Causa provável | Controle implementado | Controle pendente |
|---|---|---|---|---|
| H1 | Unidade errada (mg/dL × mmol/L) | Entrada em outra unidade | Unidade no rótulo de cada campo; faixas plausíveis bloqueiam valores absurdos | Conversor de unidades explícito |
| H2 | Fórmula incorreta/desatualizada | Erro de implementação ou diretriz nova | Testes com vetores; registro com fonte; CODEOWNERS em `scores.js` | Revisão clínica dupla; revisão semestral |
| H3 | Aplicar em população inadequada | Fórmula não validada para o paciente (ex.: CKD-EPI em IRA) | Notas de interpretação nos resultados | Critérios de aplicabilidade por calculadora |
| H4 | Campo vazio tratado como zero | Falha de validação | `missing()` retorna erro; campos opcionais explícitos | — |
| H5 | Interpretar apoio como conduta | Texto ambíguo | Aviso permanente na página; resultados são numéricos + nota | Revisão de linguagem por clínico |
| H6 | Versão antiga em cache offline | Service worker | Cache versionado (`sw.js`), teste de precache | Aviso "nova versão disponível" |
| H7 | Dado de paciente vazar | Logs/erros/DB | Cálculo local; sem telemetria; RLS + minimização | RIPD antes de ativar nuvem |
| H8 | Arredondamento mascara limiar | Round antes da comparação | Comparações usam valor bruto; arredondamento só na exibição | Testes de fronteira por calculadora |

## Regras de salvaguarda para novas funcionalidades
- Nunca sugerir conduta (dose, prescrição) sem revisão clínica e enquadramento regulatório.
- Todo resultado deve mostrar fonte/versão (a implementar na UI) e faixas de referência quando existirem.
- Erros clínicos reportados (template `clinical-error`) têm prioridade máxima: ver [runbooks/clinical-error.md](runbooks/clinical-error.md).
