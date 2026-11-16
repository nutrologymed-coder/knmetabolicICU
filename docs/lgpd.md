# LGPD (Lei 13.709/2018)

> Este documento é um guia técnico, **não** parecer jurídico. Valide com assessoria jurídica/DPO antes de ativar qualquer coleta.

## Situação atual
O app **não coleta dados pessoais**: cálculos locais, sem cookies de rastreamento, sem analytics. Em `localStorage` ficam apenas ids de calculadoras (favoritos/recentes).

## Antes de ativar contas/histórico (checklist bloqueante)
- [ ] Definir controlador, operador e **encarregado (DPO)**; publicar canal do titular.
- [ ] Base legal documentada (consentimento específico para dados de saúde, art. 11) e texto de consentimento em PT.
- [ ] **RIPD** (relatório de impacto) concluído e aprovado.
- [ ] Política de privacidade e termos publicados; contrato/DPA com Supabase e Cloudflare; verificar transferência internacional (art. 33) e região do projeto.
- [ ] Retenção definida (sugestão inicial: 12 meses de histórico, exclusão automática depois) e implementada.
- [ ] MFA obrigatório para contas de profissionais.
- [ ] Teste de restauração de backup e de exclusão de conta executados (ver runbooks).

## Princípios técnicos já implementados (`supabase/`)
- **Minimização:** sem campos de identificação direta; `patient_ref` é pseudônimo limitado a 40 caracteres.
- **Eliminação:** apagar a conta remove perfil e cálculos (`ON DELETE CASCADE`) e **anonimiza** o `audit_log`.
- **Acesso:** RLS por usuário; sem acesso anônimo; `service_role` jamais no cliente.
- **Rastreabilidade:** `audit_log` imutável (insert/delete de cálculos).

## Direitos do titular (arts. 18–19) e como atender
| Direito | Como |
|---|---|
| Acesso/portabilidade | Exportar `calculations` do usuário em JSON/CSV (a implementar) |
| Correção | Cálculos são imutáveis; recalcular e apagar o antigo |
| Eliminação | Excluir conta (cascata + anonimização) |
| Informação sobre compartilhamento | Lista de operadores na política de privacidade |

## Incidentes
Comunicar ANPD e titulares em prazo razoável (referência de mercado: 3 dias úteis); seguir [runbooks/security-incident.md](runbooks/security-incident.md).
