# 📱 Documentação de Mensagens Automáticas (WhatsApp)

Este guia descreve as situações (gatilhos) em que o sistema envia mensagens automáticas para os pacientes e o conteúdo padrão de cada uma.

## 1. Confirmação Imediata (Boas-vindas)
**Gatilho:** No momento exato em que um agendamento é criado.
**Situação:** Informar ao paciente que a reserva foi feita com sucesso.
**Conteúdo Padrão:**
> Olá *{{paciente}}*! Tudo bem? É um prazer confirmar seu agendamento na *{{clinica}}*.
>
> Estamos felizes em acompanhar você em seu processo de reabilitação.
>
> *Detalhes do Agendamento:*
> 📅 Data: *{{data}}* às *{{horario}}*
> 👤 Profissional: *{{profissional}}*
> 🛋️ Local: {{local}}
> 📍 Endereço: {{endereco}}
> 🗺️ Link do Mapa: {{local_url}}
>
> Qualquer dúvida, estamos à disposição!

---

## 2. Confirmação de Presença (24h antes)
**Gatilho:** Rodado via Cron (automação) exatamente 24 horas antes do horário do atendimento.
**Situação:** Solicitar que o paciente confirme se irá comparecer.
**Conteúdo Padrão:**
> Olá {{paciente}}, seu agendamento está confirmado para amanhã ({{data}}) às {{horario}} com {{profissional}}.
>
> 📍 {{endereco}}
> 🛋️ {{local}}
>
> *Por favor, confirme sua presença clicando no link:*
> {{confirmacao_link}}
>
> {{links_questionarios}}

---

## 3. Envio de Questionários Clínicos (12h antes)
**Gatilho:** 12 horas antes do atendimento.
**Situação:** Enviar links de escalas de dor ou questionários funcionais (ex: Roland-Morris, NDI, DASH) baseados no motivo da consulta detectado nas notas.
**Conteúdo Padrão:**
> Olá {{paciente}}, para agilizar seu atendimento, por favor preencha os formulários abaixo antes da sua consulta com {{profissional}}:
>
> {{links_questionarios}}

---

## 4. Reforço de Confirmação (8h e 2h antes)
**Gatilho:** 8 horas e 2 horas antes (se o paciente ainda não confirmou no link de 24h).
**Situação:** Garantir que o paciente veja a mensagem caso tenha esquecido a anterior.
**Conteúdo Padrão:** Reutiliza o texto de confirmação com um lembrete de urgência.

---

## 5. Lembrete Final - Confirmados (2h antes)
**Gatilho:** 2 horas antes, apenas para quem **já confirmou**.
**Situação:** "Estamos te esperando".
**Conteúdo Padrão:**
> Olá {{paciente}}, estamos te aguardando hoje às {{horario}}! Até logo.

---

## 6. Pós-Atendimento / Feedback
**Gatilho:** Após o atendimento ser marcado como finalizado.
**Situação:** Solicitar avaliação no Google ou feedback interno.
**Conteúdo Padrão:**
> Olá {{paciente}}, como foi seu atendimento hoje com {{profissional}}? Sua opinião é muito importante para nós!
>
> Deixe sua avaliação aqui: {{link_avaliacao}}

---

### 💡 Como Editar
Para alterar esses textos, acesse o menu **Configurações > Comunicação** no seu dashboard. Lá você pode editar cada modelo ou criar novos baseados em palavras-chave específicas (ex: uma mensagem diferente para "Acupuntura" e outra para "Pilates").
