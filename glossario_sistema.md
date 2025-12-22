# Glossário do Sistema Access Fisioterapia

Este documento alinha os termos solicitados com a implementação no sistema para evitar confusões.

| Termo Solicitado (Usuário) | Termo no Sistema (Código/UI) | Função / Ação | Localização no Sistema |
| :--- | :--- | :--- | :--- |
| **Questionários** | **Questionários** (UI) / `form_templates` (BD) | Criação e edição de modelos de avaliação e escalas (ex: STarT Back, ODI). Permite definir perguntas, colunas e cálculos. | **Menu:** Configurações > Questionários<br>**Rota:** `/dashboard/questionnaires` |
| **Formulários** | **Formulários** (UI) / `form_templates` (BD) | Gerenciamento geral de modelos, incluindo evoluções diárias e fichas simples. (O "pai" técnico dos questionários). | **Menu:** Configurações > Formulários<br>**Rota:** `/dashboard/forms` |
| **Avaliação** | `assessment` (Tipo) / `patient_assessments` (Dados) | O ato de preencher um questionário para um paciente. Resulta em um registro histórico. | **Aba:** Histórico > Avaliações (no Prontuário)<br>**Ação:** "Finalizar Avaliação" |
| **Evolução** | `evolution` (Tipo) / `attendance_records` (Dados) | Registro diário do atendimento (SOAP ou livre). Usa modelos do tipo 'evolution'. | **Tela:** Atendimento (Start Attendance)<br>**Aba:** Evolução do Dia |
| **Agendamento / Agenda** | `appointments` (BD) / **Agenda** (UI) | Marcação de consultas e sessões. | **Menu:** Agenda<br>**Rota:** `/dashboard/schedule` |
| **Financeiro** | `invoices` (BD) / **Financeiro** (UI) | Gestão de cobranças, faturas e recebimentos. | **Menu:** Financeiro<br>**Rota:** `/dashboard/financial` |
| **Receber Pagamento** | `updateInvoiceStatus` (Função) | Ação de confirmar que uma fatura foi paga. Abre diálogo para escolher método e parcelas. | **Local:** Detalhes da Fatura (Modal) |
| **Pacientes (Banco Global)** | `patients` (BD) | Cadastro mestre de todos os pacientes. Busca global na barra superior. | **Menu:** Pacientes<br>**Barra Superior:** Busca Global |
| **Prontuário** | `patient_records` (BD) | Histórico completo clínico do paciente (Evoluções + Avaliações + Anexos). | **Menu:** Pacientes > [Selecionar] > Prontuário |
| **Configurações** | **Configurações** (Menu) | Agrupador de menus administrativos (Equipe, Questionários, Formulários, Locais). | **Menu Superior Direito** (Engrenagem) |

## Observações Técnicas
*   **BD**: Banco de Dados (Supabase).
*   **UI**: Interface de Usuário (O que aparece na tela).
*   **Rota**: O endereço URL no navegador.

> [!NOTE]
> A distinção principal corrigida recentemente foi entre **Formulários** (Genérico/Antigo) e **Questionários** (Específico para Modelos de Avaliação com Escalas). Ambos usam a mesma tabela técnica (`form_templates`), mas são apresentados em menus separados para organização.
