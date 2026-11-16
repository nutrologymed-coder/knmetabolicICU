# ADR 0002: Sem dados de paciente por padrão

**Estado:** aceito

## Decisão
1. O app público calcula localmente e **não envia nem persiste** entradas clínicas. Apenas favoritos/recentes (ids de calculadoras) ficam em `localStorage`.
2. Quando houver histórico em nuvem, será **opt-in**, com consentimento registrado (`profiles.consented_at`), e **sem identificadores diretos**: só `patient_ref`, rótulo pseudônimo escolhido pelo profissional (nunca nome, CPF, prontuário ou data de nascimento completa).
3. Logs, analytics e relatórios de erro não podem conter entradas clínicas.

## Justificativa
Minimização (LGPD art. 6º, III) reduz o impacto de qualquer incidente. Dados de saúde são dados pessoais sensíveis (art. 11).

## Consequências
Funcionalidades que exijam identificação (prontuário integrado, WhatsApp com dados reais) exigem novo ADR, RIPD e revisão jurídica.
