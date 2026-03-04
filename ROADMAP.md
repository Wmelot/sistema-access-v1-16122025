# 🚀 Roadmap Sistema Access

Acompanhamento de progresso das implementações e correções.

## 🟢 Concluído hoje (Garantido & Auditado)
- [x] **Palmilha 5.0 - Motor Estável**:
    - [x] Otimização Reativa: Conserto do `useMemo` para não travar a porcentagem do Índice Minimalista e Tênis.
    - [x] Desacoplamento da Árvore de Decisão: Componentização isolada do *The Running Clinic* conectando perfeitamente a renderização na tela com o **Relatório Biomecânico PDF** final, sem assincronia ou conflito de boleanos.
    - [x] Buscador de Pacientes: Correção na filtragem client-side para o Box Select voltar a exibir pacientes digitados pelo nome/telefone e não mais travar apenas via ID.
- [x] **Segurança Master (Warley)**: Exclusão raiz do ID via script e vinculação blindada à conta Access em `support-mode.ts` e Forçamento manual no Supabase. Fim dos "logins fantasmas" em parceiros.
- [x] **Backup Diário (Nuven -> Máquina Local)**: Adaptação bem-sucedida do script e migração pro `IPv4 Pooler Connection` da Supabase. Terminal destravado perfeitamente!
- [x] **Segurança Multi-Tenancy (Nível NASA)**:
    - [x] Estrutura blindada e testada de validação com Zod.
- [x] **Filtros e Travas da Agenda**: Totalmente funcionais (durações, relógios blindados contra choque e feriados).

## 🟢 Concluído hoje (Garantido & Auditado)
- [x] **Propulsão Geofencing (O "Uber" de Palmilhas)**:
    - [x] **Bloco 1 & 2 (Backend & Slots)**: Rota pública `/api/public/slots` e `/api/public/partners` testadas. Busca por CEP funcional via BrasilAPI + Nominatim.
    - [x] **Agendamento Inteligente**: Calendário Axiom-Style integrado com bloqueio de horários ocupados e rodízio (shuffle) de clínicas.
    - [x] **Licenciamento Propulsão**: Refinamento de branding e terminologia ("Licenciado").
    - [x] **Radar Propulsão (Analytics)**: Dashboard Master operacional em `/radar-propulsao` com mapa de calor de CEPs e linha do tempo de leads.
- [x] **Correções de Dados**: Vinculação Warley/Access (ID: 9571532e-fdf8-4aaa-b236-416fd6459566) restaurada com endereço completo.

## 🟡 Próximos Passos (Segunda-Feira 23/02)
### 🧪 Testes de Stress e Clínica
- [ ] **Validação de Agendamento**: Simular fluxo completo de paciente -> agenda Access em tempo real.
- [ ] **Co-Piloto Biomecânico (Voz)**: Testar gravação de áudio e preenchimento automático do formulário de Avaliação Biomecânica via IA.
- [ ] **Auditoria PBE**: Verificar se os laudos gerados via Propulsão estão caindo corretamente no histórico do paciente Axiom.
- [ ] **Mapa de Dor 2.0**: Explorar viabilidade técnica de seleção por áreas delimitadas (regiões SVG) em vez de pontos isolados (Sugestão Warley).

### 🧠 Axiom Central de IA (Data Lake)
- [ ] Linkar Transcrição com o Paciente Avaliado como um "Termo de Consulta" em anexo.
- [ ] Base de treinamento: Refinar prompts do Auditor PBE com a transcrição dos áudios.

## 🔵 Prioridades para Amanhã (Quinta-Feira 26/02)
> [!IMPORTANT]
> **Anotação para a Manhã:** Warley, hoje devemos focar em fechar a **reconciliação do Cronograma Acadêmico** (garantir que as datas do PDF batam 100% com o sistema) e finalizar o **Accordion de Testes Dorsais** na Palmilha 5.0. O sistema está muito próximo do uso real, faltando apenas esse "fino trato" na consistência dos dados.

### 🎓 Axiom Acadêmico (Design de Cronograma 2.0)
- [ ] **Reconciliação Final**: Resolver discrepâncias entre o PDF original (DFM-2026) e o motor de datas do Axiom.
- [ ] **Holidays & Conflicts**: Validar se o recesso de Carnaval e outros feriados estão sendo aplicados corretamente na Timeline.
- [ ] **Print & Drafts**: Estabilizar o `PrintPreview` e o salvamento de múltiplos rascunhos em `DraftsModal`.

### 🦶 Palmilha 5.0 & Biomecânica
- [ ] **UI Polish**: Finalizar o `DorsalTestsAccordion` e garantir que todos os testes físicos da V5 estão salvando via `actions/insoles.ts`.
- [ ] **Fusão UltimatePBE**: Integrar a aba de "Biomecânica V3/V5" no `UltimatePBEForm.tsx` para centralização total.

### 🤖 IA & Infra
- [ ] **Smart Audit**: Implementar o primeiro hook de auditoria no formulário de palmilha (sugerir elementos com base nos testes sugeridos pela IA).
- [ ] **Offline Sync**: Testar persistência em `localStorage` para ambientes com Wi-Fi instável na clínica.

---
*Última atualização: 03/03/2026 às 21:12*
*Status Geral: Propulsão com envio funcionando (HTTP 200) mas CF do Diego com bugs nos campos de pé. PBE 5.0 integrado. 🚀*

## 🔴 Pendências Críticas (Março 2026)

### 🔗 Integração Propulsão — BLOQUEADO NO DIEGO
- [ ] **CF `pedidos_axion` não grava campos de pé** (`Arco_Dir`, `Antepe_Dir`, `SuporteArco`, `Elevacao`, `Alivio`, `Borda` — todos chegam no `info` mas são ignorados)
- [ ] **IdFisio truncado** — CF grava `"w"` ao invés de `"wmelot@gmail.com"`
- [ ] **Pedidos não aparecem no Podo+ sandbox** — investigar com Diego
- [ ] **Sync N_Pedido**: Firebase `site-propulsao-allpe` ≠ `dev-propulsao` — precisa config correto
- [ ] Remover logs de debug temporários após resolver

### 🦶 Palmilha 5.0 & Biomecânica
- [ ] **DorsalTestsAccordion**: Finalizar UI dos testes físicos V5
- [ ] **Fusão UltimatePBE**: Integrar aba "Biomecânica V3/V5" no `UltimatePBEForm.tsx`
- [ ] **Auditoria PBE**: Laudos via Propulsão caindo no histórico do paciente

### 🤖 IA & Infra
- [ ] **Co-Piloto Biomecânico (Voz)**: Gravação de áudio → preenchimento automático
- [ ] **Smart Audit**: Hook de auditoria no formulário de palmilha
- [ ] **Offline Sync**: Persistência em `localStorage` para Wi-Fi instável
- [ ] **IA Kinovea (Visão Computacional)**: Integrar PoseNet / TensorFlow.js ao Auditor PBE para rastreamento automático de pontos anatômicos e cálculo dinâmico de ângulos em vídeos (Substituir marcação manual frame a frame do Cimetógrafo por tracking automático de movimento).

