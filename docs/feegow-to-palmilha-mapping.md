# Proposta de Mapeamento: Feegow → Formulário de Palmilha (Axiom)

Este documento descreve como os dados extraídos do sistema **Feegow** serão mapeados para o preenchimento automático do formulário de **Palmilha Biomecânica V3** no sistema Axiom.

## 1. Mapeamento de Dados de Anamnese

| Campo Feegow (Fonte) | Variável no Axiom (Destino) | Grupo |
| :--- | :--- | :--- |
| **Pendente** | `anamnese.queixa_principal` | Queixas |
| **Pendente** | `anamnese.hma` | Queixas |
| **Pendente** | `anamnese.eva` | Dor |
| **Pendente** | `anamnese.historico_esportivo.nivel` | Histórico |
| **Pendente** | `anamnese.historico_esportivo.modalidades` | Histórico |
| **Pendente** | `anamnese.historia_pregressa.medicacao_uso` | Clínico |
| **Pendente** | `anamnese.historia_pregressa.tratamentos_previos` | Clínico |
| **Pendente** | `anamnese.historia_pregressa.cirurgias` | Clínico |
| **Pendente** | `anamnese.observacoes` | Geral |

## 2. Exame Físico (Biomecânica e Testes)

Aqui estão as variáveis técnicas que você mencionou estarem faltando.

| Campo Feegow (Fonte) | Variável no Axiom (Destino) | Descrição Técnica |
| :--- | :--- | :--- |
| **Naviculômetro (Esq/Dir)** | `exame_fisico.navicular_drop` | Navicular Drop (em mm ou cm) |
| **Nº Calçado** | `calcado.tamanho` | Tamanho do calçado do paciente |
| **FPI: Tálus** | `exame_fisico.fpi.talus` | Palpação da cabeça do tálus |
| **FPI: Malleolar** | `exame_fisico.fpi.curvatura_maleolar` | Curvatura maleolar |
| **FPI: Calcâneo** | `exame_fisico.fpi.posicao_calcaneo` | Inversão/Eversão do calcâneo |
| **FPI: TNL** | `exame_fisico.fpi.proeminencia_tln` | Articulação Talonavicular |
| **FPI: Arco** | `exame_fisico.fpi.congruencia_arco` | Altura do arco |
| **FPI: Antepé** | `exame_fisico.fpi.abducao_antepé` | Abdução do antepé |
| **Jack Test** | `exame_fisico.jack_test` | Teste de mobilidade do hálux |
| **Lunge Test** | `exame_fisico.lunge_test` | Flexão dorsal do tornozelo |
| **Thomas Test** | `exame_fisico.thomas_test` | Flexibilidade de flexores de quadril |
| **SLR / Isquios** | `exame_fisico.isquiotibiais` | Flexibilidade de isquiotibiais |
| **Força Glúteo Médio** | `exame_fisico.forca_gluteo.medio` | Teste de força muscular |
| **Força Glúteo Máximo** | `exame_fisico.forca_gluteo.maximo` | Teste de força muscular |
| **Craig Test** | `exame_fisico.craig_anteversao` | Anteversão femoral |
| **Mobilidade Raios** | `exame_fisico.mobilidade.raios` | Mobilidade intertarsal |

## 3. Calçado e Índices

| Campo Feegow (Fonte) | Variável no Axiom (Destino) | Descrição |
| :--- | :--- | :--- |
| **Modelo Calçado** | `calcado.modelo` | Nome/Marca do calçado |
| **Drop** | `calcado.drop_mm` | Drop do calçado (mm) |
| **Peso Calçado** | `calcado.peso_gramas` | Peso do calçado (g) |

---

## 🔍 Como você pode me ajudar a identificar essas variáveis?

Para que o sistema reconheça automaticamente o que é "Naviculômetro" no Feegow, eu preciso ver como esses dados chegam da API. Você pode me ajudar de duas formas:

1.  **Exemplo de JSON (Recomendado):** Se você conseguir exportar ou copiar o retorno da API do Feegow para um paciente de teste (pode apagar o nome real dele), eu poderei ver as chaves como `"field_542": "10mm"` ou `"campo_naviculo": "10"`.
2.  **Lista de Nomes de Campos:** Se você não tiver o JSON, me diga exatamente qual o **nome do campo** conforme está escrito no administrador do Feegow. Muitas vezes o "ID" do campo é baseado no nome ou em uma sequência numérica que eu consigo deduzir se eu vir o arquivo de exportação de um paciente.

---
**Status da Integração:** Aguardando lista completa de campos Feegow para mapeamento definitivo.
