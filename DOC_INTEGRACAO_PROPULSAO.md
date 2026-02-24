# Documentação de Integração: Sistema Axiom <> Propulsão

Este documento detalha o mapeamento de campos e a lógica de envio de pedidos de palmilhas para a Propulsão.

## 1. Mapeamento de Campos (Exemplos Reais)

O objeto `info` enviado via API segue agora o padrão estrito observado na base de dados Firebase:

| Campo Axiom | Valor Interno / Formato | Exemplo Base |
| :--- | :--- | :--- |
| **Cobertura** | String (Remover espaços) | `"EVAazul"`, `"EVAVerde"` |
| **Numeracao** | String | `"37"` |
| **Absorcao_dir/esq** | `"Sim"` ou `"Não"` | `"Sim"` |
| **Alivio1_dir/esq** | `"1º Met."` ou `""` | `"1º Met."` |
| **Alivio23_dir/esq** | `" 2º/3º Met."` ou `""` | `" 2º/3º Met."` |
| **Alivio45_dir/esq** | `" 4º/5º Met."` ou `""` | `" 4º/5º Met."` |
| **Barra_Dir/Esq** | `"Barra"` ou `""` | `"Barra"` |
| **Borda_Dir/Esq** | `"Borda"` ou `"0"` | `"0"` |
| **Elevacao_Dir/Esq** | String (Apenas número) | `"5"` |
| **PrecoPedido** | String | `"180"` |
| **SuporteArco** | String | `"Flexível"`, `"Rígido"` |
| **IdFisio** | **String (E-mail)** | `"wmelot@gmail.com"` |
| **dataStamp** | Number (Data atual em ms) | `1705430962290` |

---

## 2. Lógica de Geração de Resumo (Relatório)

O texto de `observacoesCompra` agora é gerado por uma lógica que evita redundância:

- **Correções Idênticas**: Se o pé esquerdo e o direito tiverem as mesmas correções biomecânicas, o sistema gera: 
  > *"Para ambos os pés, foram aplicadas correções biomecânicas visando o controle de Pronação no retropé e controle de Pronação no antepé."*
- **Correções Diferentes**: O sistema descreve cada pé individualmente para maior clareza clínica.

---

## 3. Segurança e Identificação (IdFisio)

**IMPORTANTE:** O campo `IdFisio` dentro do objeto criptografado (payload) foi alterado de **Array** para **String**. Isso garante compatibilidade com o sistema de filtragem de pedidos da Propulsão.

---

## 4. Código-Fonte Atualizado (Referência)

```typescript
// Exemplo do objeto enviado para a Cloud Function:
const info = {
    Cobertura: "EVAazul",
    Numeracao: "37",
    ladoPedido: "DireitoEsquerdo",
    PrecoPedido: "180",
    Absorcao_dir: "Não",
    Absorcao_esq: "Sim",
    Antepe_Dir: "9",
    // ... demais campos conforme mapeamento acima
};
```
