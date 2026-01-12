# Módulo Palmilha Biomecânica 2.0

Este módulo implementa a avaliação biomecânica para prescrição de palmilhas sob medida.

## Estrutura de Pastas

- `components/PalmilhaForm.tsx`: Componente "Maestro" que orquestra as seções.
- `components/BodyPainMap.tsx`: Componente visual interativo para mapa de dor.
- `components/sections/`: Sub-componentes atômicos para cada parte do formulário.
    - `AnamneseSection.tsx`: Dados clínicos, EFEP, Histórico.
    - `FPISection.tsx`: Foot Posture Index (6 critérios).
    - `FunctionalTestsSection.tsx`: Testes funcionais (Jack, Lunge, etc.).
    - `ShoeSection.tsx`: Dados do calçado e Índice Minimalista.
    - `PrescriptionSection.tsx`: Prescrição técnica.
- `schemas/palmilha-schema.ts`: Validação Zod estrita.
- `actions/submit-palmilha.ts`: Server Action para persistência segura.

## Lógica de Negócio

### 1. Índice Minimalista
Calculado automaticamente em `ShoeSection.tsx`.
A fórmula soma 5 critérios (0-5 pontos cada) e multiplica por 4 para obter a porcentagem (0-100%).
- Peso (leveza)
- Drop (quanto menor, maior a nota)
- Flexibilidade Longitudinal
- Flexibilidade Torsional
- Estabilidade (espessura)

### 2. Integração
O formulário é injetado em `attendance-client.tsx` na aba "Biomecânica V2".
Ele recebe `patientId` via prop e salva na tabela `patient_assessments` com `type='biomecanica_v2'`.

## Manutenção

Para adicionar novos campos:
1. Atualize o schema Zod em `schemas/palmilha-schema.ts`.
2. Adicione o input no componente de seção apropriado em `components/sections/`.
3. Se for um campo calculado, adicione a lógica no componente (use `useWatch`).
