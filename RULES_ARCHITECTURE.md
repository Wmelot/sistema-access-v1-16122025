# 📜 Regras de Arquitetura de Dados - Access Fisioterapia

Este documento serve como a "Bússola de Arquitetura" para o desenvolvimento. Nenhuma alteração de persistência deve violar estas regras.

## 1. Localização por Tipo de Registro

### 📁 Aba: EVOLUÇÕES (`patient_records`)
- **O que entra**: Evolução Clínica Diária, Evolução Inteligente (IA).
- **Identificador**: `template_id` vinculado ao modelo de Evolução Clínica ou metadados no `content` indicando evolução.
- **Tabela**: `patient_records`.

### 📋 Aba: AVALIAÇÕES (`patient_records`)
- **O que entra**: Todos os **FORMULÁRIOS DE AVALIAÇÃO** (Especialidades).
- **Exemplos**: SmartPBE, Biomechanics Insole (Palmilha), Avaliação Física Avançada, Pé Diabético, Saúde da Mulher.
- **Tabela**: `patient_records`.
- **Importante**: Estes registros possuem modelos (`form_templates`) específicos.

### 📝 Aba: QUESTIONÁRIOS (`patient_assessments`)
- **O que entra**: Apenas questionários **PROM (Patient-Reported Outcome Measures)** e escalas curtas.
- **Exemplos**: DASH, FAOS, Roland Morris, EVA (Dor), SF-36, MNSI (Michigan).
- **Tabela**: `patient_assessments`.
- **Regra de Ouro**: Formulários completos de avaliação física/biomecânica **NUNCA** devem ser salvos aqui.

## 2. Regras de Edição (Janela de 24 Horas)
- Registros criados há **menos de 24 horas**: Edição permitida (Modo Escrita).
- Registros criados há **mais de 24 horas**: Bloqueio total de edição (Modo Leitura / ReadOnly).
- **Bypass**: Em modo ReadOnly, as funcionalidades de **Gerar Relatório**, **Imprimir** e **Visualizar** devem permanecer 100% funcionais.

## 3. Sandbox (Ambiente de Teste)
- Ao salvar do Sandbox, o sistema deve converter o formulário em um **Agendamento Fantasma (attended)** e um registro em `patient_records`.
- **Nunca** duplicar o insert na tabela de assessments, a menos que seja explicitamente um questionário/escala aplicada via sandbox.

---
*Assinado: Antigravity (IA Senior) em 15/02/2026*
