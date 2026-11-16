# knmetabolicICU
## Calculadoras e Scores (`calculators.html`)
20 calculadoras (IMC, peso ideal, SC, mNUTRIC, HOMA-IR, ânion gap, Ca/Na corrigidos, osmolaridade, CKD-EPI 2021, Cockcroft-Gault, FIB-4, APRI, MELD/MELD-Na, P/F, qSOFA, SOFA…), client-side, PT/EN, offline (PWA).
Fórmulas em `js/scores.js` (registro puro): testes com `node tests/scores.test.js`. Para adicionar uma calculadora, inclua um objeto em `list`.
Ferramenta de apoio: valide fórmulas/unidades nas fontes originais antes do uso clínico.

Navegação: visões por Especialidade, A–Z, Doença/grupo e Favoritos; busca sem acento (nome, siglas, tags, doenças); recentes/favoritos em localStorage; link direto `calculators.html#fib4`. Metadados (`META`) ficam no fim de `js/scores.js`.
