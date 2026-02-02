# Relatório Técnico: Lógica de Agendamento e Otimização de Agenda

Este documento detalha o funcionamento técnico das regras de agendamento, antecedência mínima e os algoritmos de otimização de ocupação da agenda.

## 1. Regra de Antecedência Mínima (Min Advance Booking)

A regra de antecedência mínima foi corrigida para ser aplicada de forma rigorosa em três camadas:
1.  **Interface de Carregamento**: O calendário do agendamento agora inicia na primeira data válida disponível (ex: se hoje é Segunda e o mínimo são 2 dias, o calendário abre na Quarta).
2.  **Filtragem de Profissionais**: Profissionais que não atendem ao lead time solicitado para uma data específica são ocultados.
3.  **Rota de API (`/api/schedule/smart-suggestions`)**: Mesmo que um usuário tente acessar uma data proibida via URL ou manipulação, a API bloqueia a geração de slots se a antecedência não for respeitada.

> [!NOTE]
> A contagem de dias é baseada no dia civil (calendar days). "2 dias" significa que hoje e amanhã estão bloqueados.

---

## 2. Algoritmos de Otimização de Ocupação

O sistema utiliza um sistema de **Scoring (Pontuação)** para decidir quais horários mostrar no modo "Otimizado".

### Modos de Agenda

| Modo | Lógica de Exibição | Objetivo |
| :--- | :--- | :--- |
| **Aberto (Open)** | Mostra todos os horários livres da agenda. | Máxima liberdade para o paciente. |
| **Otimizado (Otimizado Híbrido)** | Avalia cada slot e mostra apenas os 4-6 melhores. | Reduzir janelas "buracos" e otimizar o tempo do profissional. |
| **Otimizado (Fixo)** | Foca em preencher horários âncora (ex: 08:00, 14:00) quando a agenda está vazia. | Iniciar o dia ou turno de forma organizada. |
| **Otimizado (Explorador)** | Oferece horários mais espalhados para testar novas janelas de ocupação. | Identificar novos padrões de preferência dos pacientes. |
| **Rígido (Compacto)** | Mostra APENAS horários que tocam (colados) em agendamentos já existentes. | Garantir que não existam janelas livres entre atendimentos. |

### Critérios de Pontuação (Scoring)

1.  **Preenchimento de "Buracos" (1000 pts)**: Prioridade máxima para slots entre dois agendamentos existentes.
2.  **Adjacência (500 pts)**: Slots colados (antes ou depois) a um agendamento atual.
3.  **Horários Âncora (300 pts)**: Horários preferenciais de início de turno (configuráveis pelo profissional).
4.  **Penalidade de Dispersão**: Horários muito isolados (ex: 2h de distância de qualquer outro) recebem pontuação negativa para desencorajar agendamentos no meio de turnos vazios.

---

## 3. Lista de Espera Inteligente

A lista de espera agora é mais robusta:
-   **Dias Preferenciais**: O paciente pode marcar checkboxes (Segunda a Sábado) para indicar disponibilidade.
-   **Vínculo com Organização**: Corrigido o erro que impedia a criação de entradas. Agora cada entrada é vinculada corretamente à sua clínica/unidade.
-   **Ações Rápidas**: No dashboard, os lembretes de lista de espera permitem agendar o paciente com um clique ou abrir conversa no WhatsApp.

---

## 4. Suporte a Sábados e Exceções

Implementamos a tabela de **Exceções de Agenda** (`professional_schedule_exceptions`).
-   **Sábados Isolados**: Você pode abrir um sábado específico configurando uma exceção de "Abertura Extra".
-   **Bloqueios Pontuais**: Permite bloquear um dia inteiro (ex: feriado ou congresso) sem mudar a regra semanal.
-   **Prioridade**: Exceções sempre sobressaem às regras semanais de disponibilidade.
