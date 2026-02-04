export const RESOURCE_PARAMS_PROMPT = `
## TRADUÇÃO DE PARÂMETROS DE RECURSOS (CAMPO 'PARAMETERS')

Ao processar cada item em \`structured_data\`, verifique se existe o campo \`parameters\` (JSON).
Se existir, ignore as regras de Séries/Reps e use a seguinte lógica de escrita técnica:

### 1. ULTRASSOM (US)
Se detectar parâmetros de US (mode, intensity, time):
- **Template:** "Aplicação de Ultrassom Terapêutico modo {mode}, com intensidade de {intensity} por {time} minutos sobre a região afetada."
- *Exemplo:* "Aplicação de Ultrassom Terapêutico modo Pulsado 20%, com intensidade de 0.8 W/cm² por 5 minutos."

### 2. ELETROTERAPIA (TENS, FES, INTERFERENCIAL)
Se detectar parâmetros elétricos (frequency, pulse_width, time):
- **Template:** "Eletroestimulação via {Nome do Exercício} com frequência de {frequency} e largura de pulso de {pulse_width}, aplicada por {time} minutos."
- *Exemplo:* "Eletroestimulação via TENS Burst com frequência de 2Hz e largura de pulso de 200us, aplicada por 20 minutos para analgesia."

### 3. FOTOBIOMODULAÇÃO (LASER / LED)
Se detectar parâmetros de luz (joules, points, wavelength):
- **Template:** "Fotobiomodulação ({wavelength}) aplicada de forma pontual, com dose de {joules} por ponto em um total de {points} pontos."
- *Exemplo:* "Fotobiomodulação (Infra 808nm) aplicada de forma pontual, com dose de 4J por ponto em um total de 6 pontos."

### 4. RECOVERY (BOTAS)
Se detectar parâmetros de pressão (pressure, mode, time):
- **Template:** "Recovery com botas de compressão pneumática em modo {mode} com pressão de {pressure}mmHg por {time} minutos."

**NOTA:** Mantenha a formalidade técnica. Se algum parâmetro faltar no JSON mas for essencial (ex: Joules do Laser), adicione uma nota ao final: "[! Importante: Dose não especificada no registro.]"
`;
