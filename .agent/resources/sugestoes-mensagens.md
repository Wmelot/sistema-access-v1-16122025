# Sugestões de Mensagens para Automação (WhatsApp)

Aqui estão sugestões de textos persuasivos para usar nos Templates de Mensagem do sistema (`Dashboard -> Configurações -> Comunicação -> Templates`).

## 1. Confirmação de Agendamento (Foco: Formulário Pré-Avaliação)
**Gatilho:** Confirmação de Agendamento
**Objetivo:** Garantir que o paciente preencha o formulário antes de ir.

```text
Olá {{paciente}}, tudo bem?

Seu agendamento na Access Fisioterapia está confirmado! ✅

🗓 *Data:* {{data}}
⏰ *Horário:* {{horario}}
👨‍⚕️ *Profissional:* {{profissional}}
📍 *Local:* {{local}}

⚠️ **MUITO IMPORTANTE:**
Para que sua consulta seja aproveitada ao máximo e consigamos ir direto à raiz do problema, precisamos que você preencha este formulário rápido sobre sua dor/lesão.

Isso permite que o fisioterapeuta estude seu caso ANTES de você entrar na sala. É fundamental para o sucesso do seu tratamento.

👉 *Preencher Pré-Avaliação Agora:*
[COLAR SEU LINK DO TALLY/GOOGLE FORMS AQUI]

Te aguardamos! Qualquer dúvida, pode chamar aqui.
```

---

## 2. Nova Vaga na Lista de Espera (Quando surge horário)
**Gatilho:** Manual (ou configurar futuro template de Lista de Espera)
**Objetivo:** Fazer o paciente agendar rápido a vaga que abriu.

```text
Olá {{paciente}}! 🙋‍♂️

Temos uma ótima notícia! 🎉
Surgiu uma vaga na agenda do(a) {{profissional}} que encaixa na sua preferência.

🗓 *Data:* {{data}}
⏰ *Horário:* {{horario}}

Como a procura é alta, essa vaga costuma ser preenchida em poucos minutos. Se você ainda tem interesse e quer garantir esse horário, responda "SIM" agora ou clique no link abaixo para confirmar.

👉 *Garantir meu horário:*
{{link_confirmacao}}

Aguardo seu retorno!
```

---

## 3. Lembrete de Consulta (Reforço do Formulário)
**Gatilho:** Lembrete de Agendamento (24h antes)
**Objetivo:** Lembrar do horário e cobrar o formulário se ainda não feito.

```text
Oi {{paciente}}, passando para lembrar do seu atendimento amanhã! ⏰

🗓 {{data}} às {{horario}} com {{profissional}}.

Se você ainda não preencheu o formulário de pré-avaliação, por favor, tire 2 minutinhos para fazer isso agora. Vai fazer toda a diferença na sua consulta! 🚀

Link: [COLAR LINK AQUI]

Até amanhã!
```
