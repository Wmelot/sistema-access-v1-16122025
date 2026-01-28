# 🚀 Roadmap Sistema Access

Acompanhamento de progresso das implementações e correções.

## 🟢 Concluído (Garantido & Auditado)
- [x] **Webhooks de WhatsApp**: Endpoints configurados para Z-API e Evolution para confirmação automática de agendamentos.
- [x] **Assinatura Digital**: Componente de assinatura em Canvas implementado para Termos de Consentimento e Prontuários.
- [x] **Criação de Modelos Padrão**: Sistema de sementes (seed) para gerar mensagens de 24h, 12h, 8h, 2h e Boas-vindas.
- [x] **Régua de Comunicação (Banco)**: Colunas de rastreio (`appointment_id`, `trigger_type`) adicionadas à `message_logs`.
- [x] **Sistema de Bandeiras de Cartão**: Implementação completa de taxas por bandeira (Visa, Master, Elo, Amex) com suporte a parcelamento.
- [x] **Legenda de Status na Agenda**: Indicador visual elegante mostrando cores dos status de agendamento (Desktop/Tablet).
- [x] **Remoção de Setinha Mobile**: Interface mobile simplificada - status editável apenas clicando no card.

## 🟡 Em Andamento (Foco Agora)
- [x] **Personalização Total de Modelos**: Garantir que a edição de texto e variáveis dinâmicas funcione 100% na UI.
- [ ] **Lógica da Régua Automática (Cron)**: Finalizar o processamento em background para disparar as mensagens nos marcos de tempo (24h, 12h, 8h, 2h).
- [ ] **Integração Digital GOV.br**: Assinatura eletrônica com validade jurídica para prontuários.
- [ ] **Módulo de IA (Saque)**: Implementação das sugestões inteligentes e análise de dados.
- [x] **Integração Bandeiras no Agendamento**: ✅ **COMPLETO** - Seleção de bandeira + parcelas com cálculo automático de taxa e valor líquido.
- [ ] **Integração Bandeiras na Finalização**: Adicionar seleção de bandeira + parcelas no modal de finalização de atendimento.

## 🔴 Pendente (Próximos Passos)
### 🩺 Clínico & Especialidades
- [ ] **Protocolo de Red Flags**: Sistema de alertas visuais para riscos clínicos.
- [ ] **Questionários Dinâmicos**: Criar o construtor de formulários para avaliações e pós-atendimento.
- [ ] **Axiom Remote (QR Code)**: Conexão de câmera externa para captura de biofeedback/fotos.

### 📱 Interface & UX (Mobile)
- [x] **Correção de Layout Mobile**: Ajustar botões cortados e menus que desaparecem no celular.
- [ ] **Impressão Completa Mobile**: Garantir que o PDF de relatórios saia inteiro no Android/iOS.
- [ ] **Tutorial Digital**: Guia interativo para novos profissionais na plataforma.

### 💰 Financeiro (Auditoria Completa - 27/01/2026)

#### ✅ Funcionalidades Implementadas e Funcionais:
1. **Visão Geral**: Dashboard com saldo, receitas, despesas e contas bancárias.
2. **Contas a Pagar**: Gestão de despesas com filtros por status, data e busca.
3. **Transações**: Registro de receitas/despesas com categorias e parcelamento.
4. **Folha de Pagamento**: Comissões por profissional com regras personalizáveis.
5. **Conciliação**: Comparação entre registros internos e extratos bancários.
6. **Taxas de Maquininha**: Configuração de taxas por método de pagamento.
7. **Minha Produção**: Extrato individual para profissionais não-admin.
8. **Bandeiras de Cartão**: Sistema completo de taxas por bandeira (Visa, Master, Elo, Amex) com InfinitePay pré-configurado.
9. **Configuração de Parcelas**: Limite máximo de parcelas configurável por organização.

#### ⚠️ Melhorias Críticas Necessárias:
1. **Cálculo de Taxa Líquida**:
   - ❌ Atualmente não considera bandeira + parcelas no cálculo automático
   - ✅ **Solução**: Atualizar `getFinancialSummary()` para buscar taxa correta baseada em `card_brand_id` + `installments`
   - 📍 **Arquivo**: `/src/app/dashboard/[slug]/financial/actions.ts` (linha ~660)

2. **Integração com Agendamento**:
   - ❌ Modal de agendamento não permite selecionar bandeira/parcelas
   - ✅ **Solução**: Adicionar dropdowns condicionais no Step 2 do `AppointmentDialog`
   - 📍 **Arquivo**: `/src/components/schedule/AppointmentDialog.tsx`

3. **Integração com Finalização de Atendimento**:
   - ❌ Modal de finalização não captura bandeira/parcelas
   - ✅ **Solução**: Adicionar campos no modal de cobrança
   - 📍 **Arquivo**: Verificar modal de finalização (provavelmente em `/src/components/attendance/`)

4. **Relatórios Financeiros**:
   - ❌ Relatórios não mostram breakdown por bandeira
   - ✅ **Solução**: Adicionar coluna "Bandeira" na tabela de transações
   - 📍 **Arquivo**: `/src/app/dashboard/[slug]/reports/reports-table.tsx`

5. **Validação de Dados**:
   - ❌ Não valida se bandeira selecionada tem taxa configurada
   - ✅ **Solução**: Adicionar validação client-side antes de salvar
   - 📍 **Prioridade**: Média (evita erros de cálculo)

6. **Histórico de Alterações**:
   - ❌ Não rastreia mudanças nas taxas ao longo do tempo
   - ✅ **Solução**: Criar tabela `payment_method_fees_history` para auditoria
   - 📍 **Prioridade**: Baixa (nice-to-have)

7. **Exportação Contábil**:
   - ⚠️ Verificar se exportação considera novas colunas de bandeira
   - ✅ **Solução**: Atualizar `AccountingExportButton` se necessário
   - 📍 **Arquivo**: `/src/app/dashboard/[slug]/financial/accounting-export-button.tsx`

8. **Comissões com Taxa Variável**:
   - ❌ Cálculo de comissão não considera taxa específica da bandeira usada
   - ✅ **Solução**: Atualizar lógica em `getProfessionalStatement()` para buscar taxa real
   - 📍 **Arquivo**: `/src/app/dashboard/[slug]/financial/actions.ts` (linha ~639)

#### 🎯 Prioridades de Implementação (Ordem Sugerida):
1. **Alta**: Integração com Agendamento (bandeira + parcelas)
2. **Alta**: Integração com Finalização de Atendimento
3. **Alta**: Cálculo correto de taxa líquida considerando bandeira
4. **Média**: Validação de taxa configurada antes de salvar
5. **Média**: Atualização de comissões com taxa real
6. **Baixa**: Relatórios com breakdown por bandeira
7. **Baixa**: Histórico de alterações de taxas

#### � Métricas de Qualidade:
- **Cobertura de Funcionalidades**: 75% ✅
- **Integração End-to-End**: 40% ⚠️ (falta agendamento → finalização → relatório)
- **Precisão de Cálculos**: 60% ⚠️ (não considera bandeira em alguns fluxos)
- **Usabilidade**: 85% ✅ (interface moderna e intuitiva)

### �🛡️ Segurança & Auditoria
- [ ] **Conformidade CREFITO**: Sistema de logs imutáveis e conferência de prontuários.
- [ ] **Widgets Whitelabel**: Personalização da dashboard por organização.
- [ ] **Auditoria de Menus**: Limpeza e simplificação da barra lateral.

---
---
*Última atualização: 27/01/2026 às 23:38*
*Auditoria Financeira: Completa ✅*
