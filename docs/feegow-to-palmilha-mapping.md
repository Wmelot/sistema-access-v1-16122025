# Proposta de Mapeamento: Feegow → Formulário de Palmilha (Axiom)

Este documento descreve como os dados extraídos do sistema **Feegow** serão mapeados para o preenchimento automático do formulário de **Palmilha Biomecânica V3** no sistema Axiom.

## 1. Mapeamento de Dados de Anamnese

Estes dados geralmente são encontrados no **Prontuário / Anamnese** do Feegow.

| Campo Feegow (Fonte Esperada) | Variável no Axiom (Destino) | Descrição / Lógica |
| :--- | :--- | :--- |
| **Queixa Principal** (Campo de texto livre) | `anamnese.queixa_principal` | Motivo principal da visita. |
| **HMA / Histórico Atual** (Campo de texto livre) | `anamnese.hma` | Detalhamento da evolução do sintoma. |
| **Escala de Dor (EVA)** (Valor numérico ou texto) | `anamnese.eva` | Escala visual analógica de dor (0-10). |
| **Nível de Atividade** (Campo de seleção ou texto) | `anamnese.historico_esportivo.nivel` | Mapeado para: Sedentário, Iniciante, Recreacional, Competitivo ou Elite. |
| **Uso de Medicação** (Campo de texto ou lista) | `anamnese.historia_pregressa.medicacao_uso` | Lista de medicamentos em uso. |
| **Tratamentos Prévios** (Checkboxes ou texto) | `anamnese.historia_pregressa.tratamentos_previos` | Fisioterapia, Acupuntura, Infiltrações, etc. |
| **Observações / Comorbidades** | `anamnese.observacoes` | Diabetes, Hipertensão, Cirurgias prévias. |

## 2. Exame Físico e Testes (Biometria/Avaliação)

Se estes dados existirem em formulários específicos do Feegow, podem ser extraídos por ID de campo.

| Campo Feegow (Fonte Esperada) | Variável no Axiom (Destino) | Descrição / Lógica |
| :--- | :--- | :--- |
| **FPI-6 - Talus (Esq/Dir)** | `exame_fisico.fpi.talus` | Palpação da cabeça do Tálus (-2 a +2). |
| **FPI-6 - Maleolo (Esq/Dir)** | `exame_fisico.fpi.curvatura_maleolar` | Curvatura maleolar supra e infra (-2 a +2). |
| **FPI-6 - Calcâneo (Esq/Dir)** | `exame_fisico.fpi.posicao_calcaneo` | Inversão/Eversão do calcâneo (-2 a +2). |
| **FPI-6 - TNL (Esq/Dir)** | `exame_fisico.fpi.proeminencia_tln` | Abaulamento na região da Art. Talonavicular. |
| **FPI-6 - Arco (Esq/Dir)** | `exame_fisico.fpi.congruencia_arco` | Congruência do arco longitudinal medial. |
| **FPI-6 - Antepé (Esq/Dir)** | `exame_fisico.fpi.abducao_antepé` | Adução/Abdução do antepé em relação ao retropé. |
| **Jack's Test (Esq/Dir)** | `exame_fisico.jack_test` | Teste de Windlass (0: Negativo, 1: Positivo). |
| **Lunge Test (Esq/Dir)** | `exame_fisico.lunge_test` | Mobilidade de Tornozelo (em graus ou cm). |
| **Navicular Drop (Esq/Dir)** | `exame_fisico.navicular_drop` | Queda do navicular em milímetros. |

## 3. Calçado e Prescrição

| Campo Feegow (Fonte Esperada) | Variável no Axiom (Destino) | Descrição / Lógica |
| :--- | :--- | :--- |
| **Modelo de Calçado** | `calcado.modelo` | Tipo de calçado que o paciente mais utiliza. |
| **Nº Calçado** | `calcado.tamanho` | Tamanho do pé/calçado para fabricação. |
| **Observações da Prescrição** | `prescricao.observacoes` | Orientações técnicas para a confecção da palmilha. |

---

## Próximos Passos de Integração Técnica:

1.  **Identificação de IDs no Feegow:** Para automatizar, precisaremos dos `field_id` de cada um desses campos no formulário de prontuário do Feegow.
2.  **API Endpoint:** Utilizaremos o endpoint `GET /medical-records/list` da Feegow para buscar a anamnese mais recente.
3.  **Parser de JSON:** Criaremos um script de "de-para" que converte o JSON bruto do Feegow para o esquema Zod do Axiom.

**Você concorda com este mapeamento ou gostaria de adicionar/remover alguma variável específica?**
