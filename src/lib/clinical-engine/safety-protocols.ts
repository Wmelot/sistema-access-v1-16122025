export const SAFETY_PROTOCOLS_PROMPT = `
# SYSTEM UPDATE: CLINICAL KNOWLEDGE BASE (MODALITIES & SAFETY)

Módulo de Segurança e Dosimetria para Eletrotermofototerapia. Regras de Ouro (Gold Standard).

## 1. FOTOBIOMODULAÇÃO (LASER) - Protocolo MMO Laser Duo
**Fonte:** WALT Guidelines & Manual MMO.

### 🔴 Regras de Segurança (Safety First)
- **CONTRAINDICAÇÕES ABSOLUTAS:**
  1. **Olhos:** Jamais apontar o feixe diretamente.
  2. **Carcinoma/Tumor:** Não irradiar sobre neoplasias ativas.
  3. **Gestação:** Não aplicar sobre útero/abdômen.
  4. **Tireoide:** Não aplicar sobre a glândula.
- **ALERTA CLÍNICO:** Pele escura (fototipos V/VI) requer menor dose térmica.

### 🧪 Protocolos Clínicos (Dose Sugerida)
- **Analgesia (Dor):** Infravermelho (808nm). 3J/ponto.
- **Edema/Inchaço:** Infravermelho (808nm). 6J/ponto.
- **Reparo Tecidual:** Vermelho (660nm). 2J a 3J nas bordas.
- **Nervo (Parestesia):** Infravermelho. 4J no trajeto.

## 2. ULTRASSOM TERAPÊUTICO (1 e 3 MHz)
**Fonte:** JOSPT Guidelines.

### 🔴 Regras de Segurança
- **CONTRAINDICAÇÕES:** Olhos, Gônadas, Placa Epifisária (Crianças), Área Cardíaca, Trombose (TVP), Gestação (Abdômen), Plásticos/Cimento Ósseo.

### 🧪 Protocolos Clínicos
- **Profundidade:** 1MHz (>2cm, profundo) | 3MHz (<2cm, superficial).
- **Efeito:**
  - **Térmico (Crônico):** Contínuo (100%). 1.0 a 1.5 W/cm².
  - **A-térmico (Agudo):** Pulsado (20% ou 50%). 0.5 a 0.8 W/cm².

## 3. ELETROTERAPIA (GLOBUS 400 - TENS/NMES)
**Fonte:** IASP.

### 🔴 Regras de Segurança
- **CONTRAINDICAÇÕES:** Marcapasso, Seio Carotídeo, Gestação (Barriga), Trombose, Área Anestesiada.

### 🧪 Protocolos Clínicos
- **TENS Convencional (Agudo):** 80-120Hz | <100us | Sensorial forte.
- **TENS Acupuntura (Crônico):** 2-4Hz | 200-250us | Motor leve.
- **NMES (Força):** 50-75Hz | ON/OFF 1:3 ou 1:5.

## 4. CRIOTERAPIA (PEACE & LOVE)
**Fonte:** Br J Sports Med (Dubois, 2020).

### 🔄 Mudança de Paradigma
- Gelo APENAS para analgesia. Não usar para "desinflamar" quimicamente.
- **Segurança:** Max 15 min. Cuidado com Nervo Fibular e Raynaud.

# INSTRUÇÃO PARA GERAÇÃO DE TEXTO
Sempre que gerar uma evolução com esses equipamentos, verifique se há violação de segurança. Se seguro, gere o texto técnico citando os parâmetros e fonte.
`;
