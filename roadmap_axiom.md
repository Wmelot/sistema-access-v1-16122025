# Roadmap Axiom - Próximos Passos

## 🎯 Concluído Hoje
- [x] **Modelo V3 (Nova Estrutura)**: Implementação do formulário Biomecânica V3 com nova prescrição e organização.
- [x] **Motor de Importação Feegow V3**: Parser atualizado para capturar automaticamente Força de Glúteo, Thomas Test, Psoas e variações de Lunge.
- [x] **Persistência Local (Sandbox)**: Implementação de backup em `localStorage` para evitar perda de dados em refresh ou erro de rede.
- [x] **Compressão de Imagens**: Redimensionamento e compressão automática de fotos no cliente para reduzir uso de banda e armazenamento.
- [x] **Feedback Visual no Encerramento**: Restauração do QuantumLoader ao finalizar atendimentos.
- [x] **Correção de Crash (Update Loop)**: Estabilização dos callbacks para evitar o erro de "Maximum update depth".

## 🚀 Próximos Passos (Próxima Sessão)

### 1. Unified PBE (Fusão Final)
- Integrar o modelo de prescrição da V3 no `UltimatePBEForm.tsx`.
- Criar a aba de "Biomecânica" dentro da avaliação unificada para que o profissional não precise trocar de formulário.

### 2. Dashboard & BI Clínico
- Refinar os gráficos de Radar e Evolução com base nos novos dados colhidos na V3.
- Melhorar a visualização histórica do Naviculômetro e Lunge na aba de evolução.

### 3. IA de Auditoria (Smart Audit)
- Implementar o "Auditor PBE" que analisa os dados da V3 e sugere se a conduta está alinhada com as melhores evidências.
- Geração automática de "Insights de Prescrição" baseados nos testes físicos colhidos.

### 4. Melhorias de UX
- Adicionar modo offline completo (Sync local -> Supabase quando a rede voltar).
- Implementar "Presets de Prescrição" para agilizar o preenchimento de palmilhas comuns.

---
*Roadmap gerado em 06/02/2026*
