# Runbook: incidente de segurança

1. **Conter:** revogar tokens suspeitos (Cloudflare API token, chaves Supabase, GitHub PAT); em caso de vazamento de chave `service_role`, **rotacionar** no painel Supabase imediatamente.
2. **Preservar evidências:** logs do GitHub Actions, auditoria da Cloudflare, logs do Supabase, `audit_log`.
3. **Avaliar impacto:** houve acesso a dados pessoais? Quais titulares/período? (Hoje, sem nuvem ativa, o impacto é limitado ao site público.)
4. **Erradicar e recuperar:** corrigir a causa, forçar novo deploy limpo, invalidar sessões (Supabase → Auth → revogar sessões), restaurar dados se necessário ([backup-restore.md](backup-restore.md)).
5. **Notificar:** se houver risco relevante aos titulares, avisar ANPD e titulares conforme [../lgpd.md](../lgpd.md) com apoio do DPO/jurídico.
6. **Revisar:** pós-mortem, atualizar [../security.md](../security.md) e adicionar teste/controle que teria detectado.
