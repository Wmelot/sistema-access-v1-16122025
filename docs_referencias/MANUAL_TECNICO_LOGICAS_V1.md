# MANUAL TÉCNICO DE LÓGICAS DO SISTEMA (V1)

**Data:** 03 de Janeiro de 2026
**Autor:** Antigravity (Engenharia Reversa)
**Destino:** Equipe de Desenvolvimento & Product Owner

Este documento descreve as "Caixas Pretas" do sistema: as lógicas de negócio cruciais que definem a inteligência clínica da plataforma. **Estas regras não devem ser perdidas durante refatorações.**

---

## 1. O MÓDULO DE TÊNIS/CALÇADO (Smart Shoe Recommendation)

O sistema não usa apenas uma tabela fixa; ele cruza o **Perfil do Paciente** (Histórico de Lesão) com a **Localização da Dor** para sugerir características biomecânicas.

*   **Onde está o código:** `src/components/assessments/biomechanics-constants.ts`
*   **Nome da Função:** `calculateSmartRecommendation(patientProfile, painPoints)`

### A Lógica (Pseudocódigo Explicativo)

O algoritmo segue uma árvore de decisão baseada em `injuryStatus` (Status da Lesão):

#### A. Lesão Aguda (Dor < 3 meses)
1.  **Dor Distal (Pé/Tendão de Aquiles/Fáscia)**
    *   **Sugestão:** Tênis Maximalista (Amortecimento Alto, Drop Alto > 8mm).
    *   *Racional:* Reduzir tensão mecânica no tendão de Aquiles e fáscia plantar ("proteção").
2.  **Dor Proximal (Joelho/Quadril)**
    *   **Sugestão:** Tênis com Drop Baixo (< 6mm), Baixo Amortecimento.
    *   *Racional:* Estimular cadência mais alta e reduzir o torque extensor do joelho (impacto transiente).

#### B. Lesão Persistente/Crônica (> 3 meses)
1.  **Dor Proximal (Joelho)**
    *   **Sugestão:** Índice Minimalista Alto (> 80%), Zero Drop.
    *   *Racional:* Evidência forte para redução de carga articular no joelho através de calçados que promovam pisada com mediopé.
2.  **Dor Distal (Fáscia/Aquiles)**
    *   **Sugestão:** Manter estrutura (Drop > 10mm).
    *   *Racional:* "Não cutucar a onça". Tecidos distais crônicos toleram mal o estiramento causado por drops baixos.

#### C. Sem Dor / Performance
*   **Iniciante:** Índice Moderado (60-80%). Equilíbrio entre proteção e fortalecimento.
*   **Performance:** Índice Alto ou Super-Shoes (Placa de Carbono).

### Fórmula do Índice Minimalista
Calculado em `calculateMinimalismIndex(shoe)`. Pontuação 0-100 baseada em 5 critérios (Peso, Drop, Stack Height, Flexibilidade e Estabilidade):
```typescript
Score = Peso + Drop + Stack + Flexibilidade + Estabilidade
Indice = (Score / 25) * 100
```

---

## 2. O GRÁFICO DE RADAR (BIOMECÂNICA)

O "Radar de 7 Eixos" visualiza a saúde funcional do paciente.

*   **Onde está o código:** `src/components/assessments/biomechanics-constants.ts`
*   **Nome da Função:** `calculateRadarData(data)`

### Cálculos por Eixo

1.  **Dor (Alívio):** Inverso da Escala EVA.
    *   `100 - (EVA * 10)`. Ex: EVA 8 (Dor forte) -> Nota 20 (Baixo Alívio).
2.  **Função:** Baseado no questionário EFEP (Escala Funcional Específica).
    *   `(Média dos Itens / 10) * 100` (Normalizado).
3.  **Estabilidade (Controle Motor):** Baseado no teste de Agachamento Unipodal (Single Leg Squat).
    *   Média de `Queda Pélvica` + `Valgo Dinâmico`. Mapeado de -5 a 5 para 0-100.
4.  **Força:** Baseada na Dinamometria ou Teste Manual (0-5).
    *   Média de (Glúteo Médio + Glúteo Máximo) * 20 (para virar %).
5.  **Postura (FPI - Foot Posture Index):**
    *   Penaliza desvios da normalidade (Neutro = 0).
    *   `100 - (Média(Absoluto(FPI_Esq) + Absoluto(FPI_Dir)) * 8)`.
    *   *Nota:* Quanto mais pronado/supinado (longe do 0), menor a nota.
6.  **Simetria:** Comparação L/R de medidas antropométricas.
    *   `(Menor Valor / Maior Valor) * 100`.
7.  **Flexibilidade:**
    *   ⚠️ **Atenção:** No código atual, este valor está fixado ("hardcoded") em `50` ou usando um placeholder. Necessita revisão urgente na fase de limpeza.

---

## 3. A INTELIGÊNCIA PBE (PRÁTICA BASEADA EM EVIDÊNCIA)

O sistema atua como um "Sistema de Suporte à Decisão Clínica" simples.

*   **Estrutura da Base:** `src/lib/services/smart-reports/evidence/database.json`
*   **Lógica de Match:** `src/lib/services/smart-reports/evidence-service.ts`

### Como Funciona
1.  O sistema recebe a string de **Hipótese Diagnóstica** digitada pelo fisioterapeuta (ex: "Fascite Plantar Crônica").
2.  O `EvidenceService` normaliza o texto (lowercase) e varre o array de patologias no JSON.
3.  Busca por **Palavras-Chave (Keywords)**: `['fascite', 'plantar', 'esporao']`.
4.  Se encontrar match, retorna o objeto contendo:
    *   **Evidência (Resumo):** Texto educativo sobre o tratamento padrão-ouro.
    *   **Fonte/Nível:** Ex: "JOSPT Guidelines 2023 (Nível A)".

---

## 4. FORMULÁRIOS E FLUXOS (Arquivos Críticos)

Estes são os arquivos que contêm a definição da interface de coleta de dados. **NÃO EXCLUIR.**

### 🅰️ Protocolo: Palmilha Biomecânica 2.0
*   `src/components/assessments/biomechanics-form.tsx` (Componente Principal)
*   `src/components/assessments/biomechanics-constants.ts` (Listas de exercícios, zonas anatômicas, constantes)
*   `src/app/dashboard/attendance/attendance-client.tsx` (Orquestrador que chama o formulário)

### 🅱️ Protocolo: Avaliação Física Avançada
*   `src/components/assessments/physical-assessment-form.tsx` (Monólito com 100KB+ de lógica)
*   `src/components/assessments/body-pain-map.tsx` (Componente visual do Mapa de Dor)

### 🅾️ Relatórios (Geração PDF)
*   `src/lib/services/smart-reports/mapper.ts` (Adaptador de dados DB -> Relatório)
*   `src/lib/services/smart-reports/generator.ts` (Motor de construção do JSON)
*   `src/app/reports/viewer/[assessmentId]/page.tsx` (Renderizador Visual/Impressão)

---

**Nota Final:** Este documento deve ser mantido atualizado. Qualquer alteração nas fórmulas de calçados ou radar deve ser refletida aqui.
