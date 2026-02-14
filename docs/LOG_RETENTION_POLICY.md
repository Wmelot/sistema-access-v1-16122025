# Axiom — Política de Retenção de Logs

> Documento técnico-legal para conformidade LGPD (Lei 13.709/2018) e CFM (Resolução 1.821/2007)

## 1. Visão Geral

O Axiom implementa um sistema de auditoria em **duas camadas**, separando ações de **modificação** (audit) e **visualização** (access) de dados. Essa arquitetura segue o padrão dos maiores sistemas clínicos do mercado (Tasy, MV Soul, Epic) e garante rastreabilidade completa para fins de LGPD e auditoria do CFM.

## 2. Camadas de Log

| Camada | Tabela | Descrição | Retenção |
|--------|--------|-----------|----------|
| 🛡️ Auditoria | `audit_logs` | Criação, edição, exclusão de dados clínicos | **20 anos** |
| 👁️ Acesso | `access_logs` | Visualizações de prontuários e dados sensíveis | **5 anos** |

### 2.1 Audit Logs (Modificações)

Registram **todas** as alterações em dados:
- Criação de pacientes
- Edição de dados clínicos
- Exclusão de registros
- Unificação de fichas (merge)
- Criação/edição de faturas
- Alterações de permissões

**Dados capturados:**
- `user_id` — Quem realizou a ação
- `organization_id` — Em qual clínica
- `action` — Tipo de ação (INSERT, UPDATE, DELETE, etc.)
- `table_name` / `resource` — Tabela/recurso afetado
- `resource_id` — ID do registro afetado
- `details` — JSON com detalhes (campos alterados, valores anteriores/novos)
- `ip_address` — IP do usuário
- `created_at` — Timestamp

### 2.2 Access Logs (Visualizações)

Registram **acessos de leitura** a dados sensíveis:
- Visualização de prontuário de paciente
- Acesso a dados clínicos
- Consulta de informações pessoais

**Dados capturados:**
- `user_id` — Quem acessou
- `organization_id` — Em qual clínica
- `resource_type` — Tipo de recurso (patients, records, etc.)
- `resource_id` — ID do registro acessado
- `action` — Tipo de acesso (VIEW_PATIENT, etc.)
- `ip_address` — IP do usuário
- `user_agent` — Navegador/dispositivo
- `created_at` — Timestamp

## 3. Fundamentação Legal

### LGPD (Lei 13.709/2018)
- **Art. 37** — Registro das operações de tratamento de dados pessoais
- **Art. 46** — Medidas de segurança para proteção de dados
- **Art. 6º, X** — Princípio da responsabilização e prestação de contas
- **Art. 48** — Comunicação de incidentes de segurança (logs são evidência)

### CFM (Conselho Federal de Medicina)
- **Resolução 1.821/2007** — Prontuários devem ser mantidos por **20 anos** após último atendimento
- **Resolução 2.218/2018** — Obrigatoriedade de trilhos de auditoria em sistemas eletrônicos

### ISO 27001 (Segurança da Informação)
- **A.12.4** — Logging e monitoramento
- **A.12.4.1** — Event logging
- **A.12.4.3** — Proteção de logs

## 4. Política de Limpeza

### Limpeza Automática
- `access_logs` — Registros com mais de **5 anos** são removidos automaticamente
- `audit_logs` — **NUNCA** são removidos automaticamente (mínimo 20 anos)

### Limpeza Manual
- Apenas o Super Admin pode solicitar limpeza manual
- Toda limpeza manual gera um log de auditoria próprio
- A limpeza respeita os prazos mínimos legais

### Função de Limpeza
```sql
SELECT public.cleanup_old_logs();
```

### Monitoramento
```sql
SELECT * FROM public.log_metrics;
```

## 5. Segurança dos Logs

- Logs são **imutáveis** — não podem ser editados após criação
- Acesso à tabela `audit_logs` é restrito via RLS + Admin Client
- Apenas o Master Admin pode visualizar logs cross-organization
- Logs incluem IP e User-Agent para rastreabilidade forense

## 6. Comparativo com o Mercado

| Característica | Axiom | Tasy | MV Soul | Doctoralia |
|---------------|-------|------|---------|------------|
| Audit Logs | ✅ 20 anos | ✅ 20 anos | ✅ 20 anos | ✅ 5 anos |
| Access Logs | ✅ 5 anos | ✅ 5 anos | ✅ 5 anos | ❌ |
| Separação Audit/Access | ✅ | ✅ | ✅ | ❌ |
| IP Tracking | ✅ | ✅ | ✅ | ❌ |
| User-Agent | ✅ | ❌ | ✅ | ❌ |
| Limpeza Automática | ✅ | ✅ | ✅ | ❌ |
| Exportação LGPD | ✅ PDF | ✅ PDF | ✅ CSV | ❌ |
| Cross-org (Master) | ✅ | ✅ | ✅ | ❌ |

---

*Última atualização: Fevereiro 2026*
*Responsável: Axiom Engineering Team*
