# 🚀 Roadmap Sistema Access

Acompanhamento de progresso das implementações e correções.

## 🟢 Concluído (Garantido & Auditado)
- [x] **Segurança Multi-Tenancy (Nível NASA)**:
    - [x] **Blindagem de Server Actions**: Implementação de `validateAccess` e Zod em todas as ações de pacientes.
    - [x] **Intrusion Detection**: Auditoria ativa de tentativas de acesso negado com registro de IP e User.
    - [x] **Teste de Estresse Multi-Tenant**: Validado isolamento total entre organizações via script de laboratório.
- [x] **Filtro Industrial de Horários**: O "relógio" agora só mostra horários 100% livres (Profissional + Sala + Feriados).
- [x] **Cálculo por Duração**: Travas automáticas que impedem agendar um serviço de 1h em um espaço de apenas 30min vago.
- [x] **Bloqueios Multi-Dias**: Gestão de feriados longos e reformas funcionando sem falhas no calendário.
- [x] **Relatórios Biomecânicos**: Correção de scroll, impressão de alta precisão e botões de compartilhamento rápido.
- [x] **Fluxo Financeiro SIDE-BY-SIDE**: Campos de bandeira e parcelas otimizados para preenchimento rápido na finalização.
- [x] **Alertas de Segurança & UX**: Substituição total de alertas nativos por SweetAlert2.
- [x] **UX Avançada da Agenda**: Zoom Premium, Ações Rápidas e Trava de Segurança anti-duplicidade.
- [x] **Painel de Onboarding (Admin)**: Interface visual para criação de novas clínicas (`/admin/tenants/onboarding`) sem SQL manual.

## 🟡 Em Andamento (Foco Imediato)
- [ ] **Integração Propulsão (Bloqueado)**: 
    - [x] Implementação de RSA-OAEP SHA-256 (node-forge).
    - [x] Mapeamento dinâmico de pedidos concluído.
    - [ ] **Aguardando Diego (Propulsão)**: Liberação de acesso público (IAM) para o endpoint `pedidos_axion` (Erro 403).
- [/] **Remover Hardcoding Master**: 
    - [x] Criado `is_master_user()` no Postgres.
    - [ ] **Pendente**: Remover listas de e-mails em `src/lib/auth-master.ts` e referências em `layout.tsx`.
- [ ] **Data de Entrega & Gatilhos**: Adicionar campo `data_entrega` no formulário de palmilha para alimentar automações.

## 🟠 Preparação para Escala (Pós-Carnaval)
### 💾 Backup & Integridade
- [ ] **Backup Local Automático**: Script `pg_dump` diário com rotação de 30 dias.
- [ ] **Ponte de Importação Universal**: Estrutura JSON/CSV para migrar dados de outros sistemas.

### 🚀 Desempenho
- [ ] **Paginação Inteligente**: Listas de pacientes com `limit/offset`.
- [ ] **Indexação Proativa**: Índices em `patient_id` e `organization_id`.

## 🔴 Pendente (Próximos Passos)
### 🔬 Bio-Vision Axiom (Laboratório Biomecânico)
- [ ] **Frame Grabber Integrado**: Interface de navegação frame a frame de vídeos.
- [ ] **Axiom Remote (QR Code)**: Captura de fotos/vídeos via celular direto para o prontuário.
- [ ] **Digital Goniometry**: Ferramenta de desenho de ângulos sobre as imagens capturadas.

### 💰 Financeiro (Melhorias Finais)
- [ ] **Relatórios com Breakdown por Bandeira**: Ver lucro líquido real descontando a maquininha.
- [ ] **Comissões com Taxa Variável**: Ajustar pagamento do físico com base na taxa do cartão usado.

---
*Última atualização: 17/02/2026 às 22:20*
*Status Geral: Blindagem Multi-tenant Concluída ✅*
*Status Propulsão: Aguardando Servidor ⏳*
