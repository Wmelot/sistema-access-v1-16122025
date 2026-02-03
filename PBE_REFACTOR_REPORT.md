# Relatório de Refatoração dos Formulários PBE

Este documento detalha o mapeamento entre os nomes antigos dos componentes de formulário e seus novos nomes em inglês, visando maior manutenibilidade e padronização do projeto.

## Mapeamento de Arquivos e Componentes

| Nome Antigo do Arquivo | Novo Nome do Arquivo | Nome Visual (Display Name) | Componente Exportado |
| :--- | :--- | :--- | :--- |
| `PalmilhaAccessForm.tsx` | `BiomechanicsInsoleForm.tsx` | Palmilha Biomecânica | `BiomechanicsInsoleForm` |
| `PhysicalAssessmentFormLegacy.tsx` | `AdvancedPhysicalForm.tsx` | Avaliação Física Avançada | `AdvancedPhysicalForm` |
| `PBEForm.tsx` | `SmartPBEForm.tsx` | Avaliação PBE (Inteligente) | `SmartPBEForm` |
| `SmartAssessmentForm.tsx` | `ConceptPBEForm.tsx` | Formulário Conceito PBE Inicial | `ConceptPBEForm` |

## Detalhes das Mudanças

### 1. Palmilha Biomecânica
- **Arquivo**: `src/features/pbe/components/BiomechanicsInsoleForm.tsx`
- **Descrição**: Formulário completo para avaliação de palmilhas e biomecânica.
- **Status**: Renomeado e referências atualizadas.

### 2. Avaliação Física Avançada
- **Arquivo**: `src/features/pbe/components/AdvancedPhysicalForm.tsx`
- **Descrição**: Versão avançada da avaliação física, contendo cálculos de composição corporal, bioimpedância, e testes físicos.
- **Status**: Renomeado e referências atualizadas.

### 3. Avaliação PBE (Inteligente)
- **Arquivo**: `src/features/pbe/components/SmartPBEForm.tsx`
- **Descrição**: Formulário inteligente com lógica de regiões, protocolos automáticos e integração com IA.
- **Status**: Renomeado e referências atualizadas.

### 4. Conceito PBE Inicial
- **Arquivo**: `src/features/pbe/components/ConceptPBEForm.tsx`
- **Descrição**: Versão conceitual e mais simplificada da avaliação PBE.
- **Status**: Renomeado e referências atualizadas.

## Estrutura de Diretórios

Os formulários permanecem centralizados em `src/features/pbe/components/`, seguindo a arquitetura orientada a funcionalidades (Feature-Sliced Architecture simplificada) adotada no projeto.

## Próximos Passos
- Unificação das melhores features no `UltimatePBEForm.tsx`.
- Remoção de código morto ou duplicado após a consolidação.
