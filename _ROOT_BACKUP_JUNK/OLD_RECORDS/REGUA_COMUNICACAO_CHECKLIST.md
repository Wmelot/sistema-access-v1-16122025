# 📋 Checklist: Configuração da Régua de Comunicação (Baseada em Regras)

A nova lógica de comunicação funciona como um **"Construtor de Regras"**. Em vez de escolher gatilhos fixos, você define o evento principal e configura o prazo e os filtros.

### 1. ⚙️ Como configurar suas Regras
Acesse **Configurações > Comunicação** e clique em **"Novo Modelo"**.

- [ ] **Boas-vindas (No momento do agendamento)**  
  - *Gatilho:* `No momento do agendamento`
  - *Filtro (Opcional):* Deixe vazio para todos, ou coloque "Avaliação" para mensagens específicas.
  
- [ ] **Lembrete de Confirmação (24h antes)**  
  - *Gatilho:* `Lembrete de Agendamento`
  - *Nota:* O sistema já gerencia os reforços de 8h e 2h automaticamente se você ativar as chaves no modelo.
  
- [ ] **Pós-Atendimento (Follow-up Inteligente)**  
  - *Gatilho:* `Pós-atendimento / Follow-up`
  - *Prazo:* Configure **Dias** e **Horas** (ex: 0d 1h para feedback imediato, ou 40d 0h para revisão).
  - *Filtro de Serviço:* Escreva **"palmilha"** para que o sistema só envie esse modelo para quem comprou palmilhas.

---

### 🧩 2. Guia de Variáveis (Tags)
Copie e cole estas tags nos seus textos:

- `{{paciente}}` -> Nome do paciente (primeiro nome)
- `{{data}}` -> Data do atendimento
- `{{horario}}` -> Hora do atendimento
- `{{profissional}}` -> Nome do fisioterapeuta
- `{{clinica}}` -> Nome da sua clínica
- `{{servico}}` -> Nome do serviço (ex: Palmilha)
- `{{local}}` -> Nome da sala ou consultório
- `{{confirmacao_link}}` -> Link para o paciente confirmar
- `{{link_questionario}}` -> Link do questionário vinculado
- `{{link_avaliacao}}` -> Seu link do Google Reviews

---

### ⚖️ 3. A Lógica do Sistema
1. **O Gatilho dispara:** O sistema detecta o evento (ex: Atendimento Finalizado).
2. **O Filtro valida:** Ele olha o nome do serviço (ex: "Palmilha de Corrida"). Se o seu modelo tiver o filtro "palmilha", ele entra na fila.
3. **O Prazo agenda:** Ele calcula o horário exato (Agora + Dias + Horas) e coloca na fila de envio.
4. **Sem Limites:** Você pode criar quantas regras quiser para o mesmo gatilho. O sistema enviará todas as que passarem no filtro de serviço.

---
*Assinado: Antigravity AI*
