
/**
 * PBE 5.0 Feegow Parser
 * Parses raw text from Feegow and maps it to PBE 5.0 form structure.
 */

export function parsePBE5FeegowText(text: string) {
    const extractNum = (label: string) => {
        const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`${escapedLabel}\\s*(?::\\s*|\\r?\\n)\\s*(-?\\d+[.,]?\\d*)`, 'i');
        const match = text.match(regex);
        return match ? parseFloat(match[1].replace(',', '.')) : undefined;
    };

    const extractStatus = (label: string) => {
        const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`${escapedLabel}\\s*(?::\\s*|\\r?\\n)\\s*([^\\n\\r<]+)`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : undefined;
    };

    const extractMultiline = (label: string, nextLabels: string[]) => {
        const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const lookahead = nextLabels.map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        const regex = new RegExp(`${escapedLabel}\\s*(?::\\s*|\\r?\\n)\\s*([\\s\\S]+?)(?=\\r?\\n(?:${lookahead})|$)`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : undefined;
    };

    const data: any = {
        anamnesis: {},
        clinical: {},
        metrics: {},
        sports: {},
        mobility: {},
        posture: {},
        movement: {},
        strength: {},
        conduct: {},
        protocols: {}
    };

    // 1. ANAMNESE
    data.anamnesis.qp = extractMultiline('QP', ['HMA', 'EVA', 'HP', 'Medicação', 'Tálus', 'Numeração', 'Número']);
    data.anamnesis.hma = extractMultiline('HMA', ['EVA', 'HP', 'Medicação', 'Tálus', 'Numeração', 'Número']);
    data.anamnesis.eva = extractNum('EVA Atividade') || extractNum('EVA') || 0;

    // 2. CLINICAL
    data.clinical.history = extractMultiline('HP', ['Medicação', 'Outros Esportes', 'Tálus']);
    const meds = extractStatus('Medicação');
    if (meds && meds.toLowerCase() !== 'nenhum' && meds.toLowerCase() !== 'ndn') {
        data.clinical.meds = [{ name: meds, dose: "" }];
    }

    // 3. SPORTS
    data.sports.activity = extractStatus('Atividade Física Regular') || "";
    data.sports.frequency = extractStatus('Frequência Atividade Física') || "";
    const otherSports = extractStatus('Outros Esportes');
    if (otherSports) {
        data.sports.activity = data.sports.activity ? `${data.sports.activity}; ${otherSports}` : otherSports;
    }

    // 4. METRICS (Weight, Height, Shoe size)
    data.metrics.weight = String(extractNum('Peso') || "");
    data.metrics.height = String(extractNum('Altura') || "");
    data.metrics.hr = String(extractNum('Freq. Cardíaca') || "");
    data.metrics.shoeSize = String(extractNum('Número do Calçado') || extractStatus('Número do Calçado') || extractStatus('Numeração') || "");

    // 5. MOBILITY / PROTOCOLS
    const lungeE = extractNum('Lunge Teste E') || extractNum('Lunge E');
    const lungeD = extractNum('Lunge Teste D') || extractNum('Lunge D');

    if (lungeE || lungeD) {
        data.protocols.tornozelo_pe = data.protocols.tornozelo_pe || {};
        let result = "";
        if (lungeE) result += `E: ${lungeE} `;
        if (lungeD) result += `D: ${lungeD}`;
        data.protocols.tornozelo_pe.lunge = { checked: true, result: result.trim() };
    }

    const navE = extractNum('Naviculômetro E') || extractNum('Navicular E');
    const navD = extractNum('Naviculômetro D') || extractNum('Navicular D');
    if (navE || navD) {
        data.protocols.tornozelo_pe = data.protocols.tornozelo_pe || {};
        let result = "";
        if (navE) result += `E: ${navE} `;
        if (navD) result += `D: ${navD}`;
        data.protocols.tornozelo_pe.navicular_drop = { checked: true, result: result.trim() };
    }

    // 6. POSTURE
    data.posture.pelvicAlignment = extractStatus('Alinhamento Pélvico');

    // 7. MOVEMENT / GAIT
    data.movement.gaitDescription = extractMultiline('Descrição da Marcha', ['Sugestões de Exercícios', 'Arco']);

    // 8. CONDUCT
    data.conduct.suggestions = extractMultiline('Sugestões de Exercícios', ['Arco', 'FPI']);

    // 9. REFINING PROTOCOLS (FOOT/ANKLE)
    const fpiE = extractNum('FPI Total E') || extractNum('FPI E');
    const fpiD = extractNum('FPI Total D') || extractNum('FPI D');
    if (fpiE || fpiD) {
        data.protocols.tornozelo_pe = data.protocols.tornozelo_pe || {};
        data.protocols.tornozelo_pe.fpi = { checked: true, result: `E: ${fpiE || '-'} | D: ${fpiD || '-'}` };
    }

    const jackE = extractStatus('Teste de Jack E') || extractStatus('Jack E');
    const jackD = extractStatus('Teste de Jack D') || extractStatus('Jack D');
    if (jackE || jackD) {
        data.protocols.tornozelo_pe = data.protocols.tornozelo_pe || {};
        data.protocols.tornozelo_pe.jack_test = { checked: true, result: `E: ${jackE || '-'} | D: ${jackD || '-'}` };
    }

    // 10. HIP PROTOCOLS
    const thomasE = extractStatus('Teste de Thomas E') || extractStatus('Thomas E');
    const thomasD = extractStatus('Teste de Thomas D') || extractStatus('Thomas D');
    if (thomasE || thomasD) {
        data.protocols.quadril = data.protocols.quadril || {};
        data.protocols.quadril.thomas = { checked: true, result: `E: ${thomasE || '-'} | D: ${thomasD || '-'}` };
    }

    const trend = extractStatus('Trendelenburg');
    if (trend) {
        data.protocols.quadril = data.protocols.quadril || {};
        data.protocols.quadril.trendelenburg = { checked: true, result: trend };
    }

    // Append raw info to HMA for safety
    let footSummary = "";
    if (fpiE || fpiD || jackE || jackD) {
        footSummary += `\n--- DADOS DOS PÉS ---\nFPI: E=${fpiE || '-'}, D=${fpiD || '-'}\nJACK: E=${jackE || '-'}, D=${jackD || '-'}\n`;
    }
    if (footSummary) {
        data.anamnesis.hma = (data.anamnesis.hma || "") + footSummary;
    }

    return data;
}
