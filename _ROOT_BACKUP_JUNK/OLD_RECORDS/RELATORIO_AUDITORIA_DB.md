# Relatório de Auditoria do Sistema

Este relatório destaca as discrepâncias encontradas entre o código da aplicação e a estrutura provável do banco de dados, bem como potenciais pontos de falha identificados.

## 1. Divergências em Dados de Pacientes

### Datas de Nascimento
*   **Código (Frontend):** Usa preferencialmente `date_of_birth` (string ISO, ex: "1990-01-01").
*   **Banco de Dados:** A tabela `patients` utiliza a coluna `birthdate` (tipo `date` ou `timestamp`).
*   **Situação Atual:** O arquivo `actions/patients.ts` faz o mapeamento manual (`birthdate: date_of_birth`).
*   **Risco:** Componentes que leem diretamente do banco sem passar pela formatação da `action` podem falhar ao tentar acessar `patient.date_of_birth` se o banco retornar `birthdate`. O formulário de edição já trata isso (`initialData.birthdate || initialData.date_of_birth`), mas outros componentes podem não tratar.

### Endereço
*   **Código (Frontend):** O formulário coleta `cep`, `address` (logradouro), `number`, `complement`, `neighborhood`, `city`, `state` separadamente.
*   **Banco de Dados:** A tabela `patients` possui uma coluna `address` do tipo JSONB que armazena todos esses dados agrupados.
*   **Problema Potencial:** É provável que a tabela `patients` *também* tenha colunas antigas (`city`, `state`, etc.) que **não estão sendo atualizadas** quando o endereço muda, pois o código apenas atualiza o JSONB `address`.
*   **Impacto:** Relatórios ou filtros SQL que tentarem usar `WHERE city = '...'` podem retornar dados incorretos ou desatualizados se não consultarem dentro do JSONB `address->>'city'`.

## 2. Status de Agendamentos e Financeiro

### Constraint de Status
*   **Banco de Dados:** A coluna `status` na tabela `appointments` possui uma restrição (`CHECK constraint`) que aceita apenas valores pré-definidos (ex: `scheduled`, `confirmed`, `attended`, `cancelled`, `completed`, `no_show`). **Não aceita "paid".**
*   **Código (Ações):**
    *   A ação `updateAppointment` (usada na edição via calendário) tenta salvar o status enviado pelo formulário diretamente no banco. **Risco Crítico:** Se a interface permitir selecionar "Pago" ou "Recebido", o sistema quebrará com erro de banco de dados.
    *   A ação `updateAppointmentStatus` (usada no menu de contexto/lista) foi corrigida recentemente para criar uma Fatura (`invoices`) quando a intenção é marcar como pago, contornando o erro.

### Fluxo de Caixa
*   **Entradas:** Lidas da tabela `invoices` (Faturas) e `appointments` (para previsões).
*   **Saídas:** Lidas da tabela `transactions` (onde `type = 'expense'`).
*   **Confusão:** Existe uma tabela `transactions` e possivelmente `financial_transactions`. O sistema parece usar `transactions` para despesas manuais ("Contas a Pagar"), enquanto recebimentos de pacientes ficam em `invoices`. Isso está funcional, mas a nomenclatura pode gerar confusão futura.

## 3. Segurança e Organização (Multi-tenant)

*   **Identificação:** O sistema confia na tabela `profiles` para vincular o usuário (`user.id`) à organização (`organization_id`).
*   **Isolamento:** A maioria das ações verifica corretamente o `organization_id`.
*   **Profiles vs Users:** O sistema assume que todo usuário em `auth.users` tem uma entrada em `public.profiles`. Se um usuário for criado manualmente no Auth sem criar o Profile, ele não conseguirá acessar nada (o que é o comportamento seguro desejado).

## 4. Recomendação de Correções (Sem alterações aplicadas)

1.  **Padronização de Endereço:** Decidir se usamos colunas individuais ou JSON. Se JSON for o padrão, remover as colunas individuais do banco ou garantir que elas sejam atualizadas via Trigger ou no código para manter consistência.
2.  **Edição de Agendamento:** Modificar `updateAppointment` em `src/actions/appointments.ts` para implementar a mesma lógica de segurança da `updateAppointmentStatus`: se o status for "Pago", criar fatura e não tentar forçar o status no agendamento.
3.  **Tipagem Estrita:** Criar um arquivo de definições de tipos (`src/types/schema.ts`) que reflita exatamente o banco de dados e usar ele em todas as `actions` para evitar erros de digitação de colunas (ex: `birthdate` vs `date_of_birth`).

**Status:** Varredura concluída. Nenhuma alteração de código foi feita nesta etapa.
