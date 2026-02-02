
# 🌅 Plano de Ação - Retomada (Financeiro & Pacientes)

Bom dia! Aqui está o resumo do que precisamos atacar assim que você voltar, para finalizar o módulo financeiro e resolver o mistério dos pacientes sumidos.

## 🚨 Prioridades Imediatas

1.  **Resolver Listagem de Pacientes (Crítico)**
    *   **Sintoma:** A lista continua vazia na Vercel, mesmo após a correção do banco.
    *   **Suspeita:** Pode ser um problema de Cache do Next.js (ISR) ou Row Level Security (RLS) bloqueando a visualização.
    *   **Ação:** Vamos forçar uma limpeza de cache (`revalidatePath`) e verificar as políticas de segurança do banco que podem estar escondendo os dados do seu usuário.

2.  **Validar Link de Pagamento no Fechamento**
    *   **Estado Atual:** Chave API corrigida localmente (`.env.local`).
    *   **Ação:** Testar o envio da cobrança **localmente** assim que os pacientes reaparecerem. Se funcionar, aplicaremos a chave na Vercel.

3.  **Deploy das Correções**
    *   **O que falta:** Subir as correções do cálculo de imposto (Bruto vs Líquido) e a lógica de envio imediato do WhatsApp para produção.
    *   **Ação:** Fazer o `git push` de tudo que arrumamos hoje.

---

## 💻 Comando para Recomeçar

Quando você abrir o terminal amanhã, copie e cole este comando. Ele vai limpar o cache local do Next.js e reiniciar o servidor "zerado" para garantir que estamos vendo a versão mais atual:

```bash
# Limpa cache e inicia servidor limpo
rm -rf .next && npm run dev
```

Descanse bem! Amanhã matamos esses bugs. 👊
