# Runbook: erro clínico reportado

**Severidade:** alta. Meta: confirmar em 24h, corrigir/mitigar em 48h.

1. **Triagem:** reproduzir com os valores fictícios do template `clinical-error`; confirmar fonte primária. Não coletar dados reais do paciente.
2. **Classificar:** resultado errado (bug) · unidade/faixa · interpretação/limiar · uso fora da população.
3. **Mitigar imediatamente** se houver risco: desativar a calculadora (remover de `list` ou exibir aviso) e fazer deploy; atualizar `CACHE` do service worker.
4. **Corrigir:** teste que falha primeiro, depois a correção em `js/scores.js`; revisão clínica dupla; atualizar `validation/registry.json` e o changelog clínico.
5. **Comunicar:** aviso visível no site por 30 dias descrevendo o problema e as versões afetadas.
6. **Pós-mortem** sem culpados em até 7 dias; adicionar controle ao hazard log em [../clinical-safety.md](../clinical-safety.md).
