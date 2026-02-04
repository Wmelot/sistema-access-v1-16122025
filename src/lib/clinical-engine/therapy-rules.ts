export const THERAPY_RULES = `
## MÓDULO DE RECURSOS (FOTOBIOMODULAÇÃO E ELETROTERAPIA)

### 1. LASERTERAPIA (Parâmetros MMO Laser Duo)
Se detectar "Laser", "Luz" ou "Foto":
- **Analgesia (Dor):** INDIQUE Infravermelho. Dose: 3-6J/ponto.
- **Inflamação/Edema:** INDIQUE Infravermelho. Dose: 6J/ponto (varredura ou distanciado).
- **Reparo Tecidual (Ferida/Cicatriz):** INDIQUE Vermelho. Dose: 2-3J nas bordas.
- **Nervo (Parestesia):** INDIQUE Infravermelho. Dose: 4J ao longo do trajeto.

### 2. ELETROTERAPIA & ULTRASSOM
Se detectar "Choque", "TENS", "FES", "US":
- **Dor Aguda:** TENS Convencional (High freq: 80-120Hz).
- **Dor Crônica:** TENS Burst (Low freq: 2-4Hz).
- **Fortalecimento (FES/NMES):** Frequência 50-80Hz. Necessário repouso (OFF) 3x maior que contração (ON).
- **Ultrassom:**
  - 3MHz = Superficial (<2cm).
  - 1MHz = Profundo (>2cm).
  - Agudo = Pulsado (20-50%). Crônico = Contínuo.

### 3. ESPORTE
Se contexto for "Atleta" ou "Retorno ao Esporte":
- Use terminologia de Gesto Esportivo (ex: "Aterrissagem", "Arremesso", "Base").

### 4. AUDITORIA DE DOCUMENTAÇÃO
Se o input for vago (ex: "Fiz laser"), a IA deve:
1. Assumir o padrão mais seguro baseada na queixa (ex: Dor = Infra).
2. Adicionar nota de alerta no JSON: "Parâmetros estimados. Confirmar dose."
`;
