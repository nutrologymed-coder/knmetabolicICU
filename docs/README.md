# Documentação do projeto

| Documento | Para quê |
|---|---|
| [architecture.md](architecture.md) | Visão geral, ambientes e fluxo de dados |
| [adr/](adr/) | Decisões de arquitetura (stack, escopo sem dados de paciente, modelo de dados/RLS) |
| [clinical-safety.md](clinical-safety.md) | Gestão de risco clínico, *hazard log*, processo de validação e revisão de fórmulas |
| [lgpd.md](lgpd.md) | Proteção de dados: bases legais, minimização, direitos do titular, retenção |
| [security.md](security.md) | Modelo de ameaças, controles e checklist de endurecimento |
| [setup-cloud.md](setup-cloud.md) | Passo a passo: GitHub, Cloudflare Pages, Supabase (o que exige ação humana) |
| [release.md](release.md) | Processo de release, versionamento clínico e rollback |
| [runbooks/](runbooks/) | Incidente de segurança, erro clínico, restauração de backup |

**Estado atual (honesto):** o app público é estático e **não coleta dados de pacientes**. O esquema Supabase (`supabase/`) está pronto e testado (pgTAP), mas **não deve ser ligado ao front-end** antes do checklist de produção em [lgpd.md](lgpd.md) e [setup-cloud.md](setup-cloud.md). Nenhuma fórmula está marcada como *reviewed* em `validation/registry.json`: a revisão clínica independente ainda é pendente.
