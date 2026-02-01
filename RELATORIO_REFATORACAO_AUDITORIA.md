# Relatório de Refatoração e Auditoria de Duplicatas

## 1. Lógica de Atendimento (Consolidada ✅)
**Status:** Concluído.
**O que foi feito:**
- **`AttendanceService` Centralizado**: Agora toda a lógica de iniciar, finalizar e verificar atendimentos ativos reside em `src/services/attendance-service.ts`.
- **Ações Unificadas**: `src/actions/attendance.ts` é agora o ponto único de entrada para o frontend.
- **Remoção de Duplicatas**: 
    - `src/actions/anamnesis.ts` (Removido)
    - `src/actions/attendance-actions.ts` (Removido)
    - `src/components/attendance/actions.ts` (Removido)
- **UI Única**: O componente `AttendanceConflictDialog.tsx` foi removido em favor do uso padronizado do SweetAlert em todo o sistema.

---

## 2. Controle Financeiro na Mudança de Status (Novo ✨)
**Status:** Implementado.
**Problema Detectado:** Ao mudar um atendimento de "Finalizado" para outro status, as comissões eram apagadas automaticamente e o faturamento ficava inconsistente sem aviso ao usuário.
**Solução:**
- Implementei um **Alerta de Segurança Financeira** (SweetAlert) no `AppointmentCard` e no `AppointmentDialog`.
- Agora, se você tentar reabrir um atendimento faturado, o sistema pergunta:
    1. **Mudar e APAGAR recebimento**: Remove a venda e a comissão (limpa o financeiro).
    2. **Mudar e MANTER recebimento**: Altera o status mas preserva o registro financeiro e a comissão (útil para correções de agenda que não afetam o bolso).
    3. **Cancelar**: Mantém tudo como está.
- A lógica de backend em `syncInvoiceAndCommission` foi atualizada para respeitar essa escolha.

---

## 3. Auditoria de Duplicatas Remanescentes (Atenção ⚠️)
Abaixo estão as áreas que ainda possuem códigos ou arquivos duplicados ou redundantes, resultantes de migrações parciais ou versões experimentais:

### A. Avaliações e Formulários (Componentes) ✅
**Status:** Concluído.
- **Regiões**: Unificadas em `src/features/pbe/components/regions/`. Pasta antiga removida.
- **Biomecânica**: Unificado em `src/features/pbe/`.
- **Fichas**: Substituídas pela `PhysicalAssessmentUltimate.tsx`. Arquivos legados (V1/V2) removidos.

### B. Ações de Preço (Pricing)
- Existe uma divisão entre `src/app/dashboard/[slug]/prices/actions.ts` (gerenciamento) e `src/app/dashboard/[slug]/schedule/pricing-actions.ts` (leitura rápida para agenda).
- **Sugestão**: Unificar as lógicas de leitura em um único `src/actions/pricing.ts` para evitar inconsistências no cálculo de descontos.

### C. Ações Financeiras
- Fragmentação entre `financial/actions.ts`, `financial/accounting-actions.ts` e o arquivo geral `src/actions/billing.ts`.
- Algumas lógicas de "gerar fatura" estão repetidas em dois ou três lugares com pequenas variações.

### D. Componentes de UI "Zumbis"
- Existem diversos componentes em `src/components/ui` que foram customizados em cima do Shadcn, mas existem versões levemente diferentes em outras pastas (ex: `currency-input` vs `money-input`).

---

## 🎯 Sugestão de Próximos Passos:
1. **Limpeza das Regiões**: Deletar a pasta `src/components/assessments/regions/` e apontar todos os formulários para `src/features/pbe/components/regions/`.
2. **Unificação Financeira**: Consolidar `billing.ts` e `accounting-actions.ts` em um `FinancialService` robusto, similar ao que fizemos com o Atendimento.
3. **Migração V1 -> V2**: Confirmar se a versão 1 da Ficha de Avaliação Física ainda é necessária ou se podemos tornar a V2 o padrão definitivo.
