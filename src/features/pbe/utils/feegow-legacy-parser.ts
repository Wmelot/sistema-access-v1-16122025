/**
 * Parses raw text from Feegow into the structure of BiomechanicsInsoleForm.
 */
export function parseFeegowToLegacyForm(text: string): any {
    const data: any = {
        hma: {},
        postural: { navicular: {}, fpi_left: {}, fpi_right: {} },
        tests: {
            jack: {},
            single_squat: {},
            ventral: { measures: { left: {}, right: {} }, rotation: {}, craig: {} },
            glute_strength: {}
        },
        efep: [],
        history: { treatments: [] },
        shoe: {},
        plan: {}
    };

    const extractNum = (label: string) => {
        const regex = new RegExp(`${label}\\s*[:\\s]\\s*(-?\\d+[.,]?\\d*)`, 'i');
        const match = text.match(regex);
        return match ? parseFloat(match[1].replace(',', '.')) : undefined;
    };

    const extractStatus = (label: string) => {
        const regex = new RegExp(`${label}\\s*[:\\s]\\s*([^\\n\\r<]+)`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : undefined;
    };

    // QP & HMA
    const qpMatch = text.match(/QP\s*[:\s]\s*([^\n]+)/i);
    if (qpMatch) data.hma.qp = qpMatch[1].trim();

    const hmaMatch = text.match(/HMA\s*[:\s]\s*([\s\S]+?)(?=\n\n|\n[A-Z][a-z]+ \d|$)/i);
    if (hmaMatch) data.hma.history = hmaMatch[1].trim();

    data.hma.eva = [extractNum('EVA Atividade') || 0];

    // EFEP
    const efepMatches = [...text.matchAll(/Atividade (\d+)\s*\n\s*([^\n]+)\n\s*EVA Atividade\s*\n\s*(\d+)/gi)];
    efepMatches.forEach(m => {
        const index = parseInt(m[1]) - 1;
        if (!data.efep[index]) data.efep[index] = {};
        data.efep[index].activity = m[2].trim();
        data.efep[index].score = m[3];
    });

    // FPI Detail
    data.postural.fpi_left = {
        talus: String(extractNum('Tálus E') || 0),
        curves: String(extractNum('Maléolo E') || 0),
        calcaneus: String(extractNum('Calcâneo E') || 0),
        tln: String(extractNum('Navicular E') || 0),
        arch: String(extractNum('Arco E') || 0),
        abduction: String(extractNum('Dedos E') || 0)
    };
    data.postural.fpi_right = {
        talus: String(extractNum('Tálus D') || 0),
        curves: String(extractNum('Maléolo D') || 0),
        calcaneus: String(extractNum('Calcâneo D') || 0),
        tln: String(extractNum('Navicular D') || 0),
        arch: String(extractNum('Arco D') || 0),
        abduction: String(extractNum('Dedos D') || 0)
    };

    // Navicular Drop
    data.postural.navicular.left = String(extractNum('Naviculômetro E') || "");
    data.postural.navicular.right = String(extractNum('Naviculômetro D') || "");

    // Tests
    data.tests.jack.left = extractStatus('Teste de Jack E') === 'Normal' ? 1 : 0;
    data.tests.jack.right = extractStatus('Teste de Jack D') === 'Normal' ? 1 : 0;

    data.tests.lunge = {
        left: String(extractNum('Lunge Teste E') || ""),
        right: String(extractNum('Lunge Teste D') || "")
    };

    // Ventral Measures
    data.tests.ventral.measures.left.retro = extractNum('Retropé E');
    data.tests.ventral.measures.left.ante = extractNum('Antepé Livre E');
    data.tests.ventral.measures.left.apa = extractNum('APA E');

    data.tests.ventral.measures.right.retro = extractNum('Retropé D');
    data.tests.ventral.measures.right.ante = extractNum('Antepé Livre D');
    data.tests.ventral.measures.right.apa = extractNum('APA D');

    data.tests.ventral.rotation.left = extractNum('Rigidez Rotadores Laterais do Quadril E');
    data.tests.ventral.rotation.right = extractNum('Rigidez Rotadores Laterais do Quadril D');

    data.tests.ventral.craig.left = extractNum('Teste de Craig E');
    data.tests.ventral.craig.right = extractNum('Teste de Craig D');

    // Glute Strength (Feegow uses qualitative, Form uses slider 0-10)
    const strengthMap: Record<string, number> = { 'Normal': 5, 'Reduzida': 3, 'Muito Reduzida': 1 };
    data.tests.glute_strength.med_left = strengthMap[extractStatus('Atividade Glúteo Médio E') || 'Normal'] || 5;
    data.tests.glute_strength.med_right = strengthMap[extractStatus('Atividade Glúteo Médio D') || 'Normal'] || 5;
    data.tests.glute_strength.max_left = strengthMap[extractStatus('Atividade Glúteo Máximo E') || 'Normal'] || 5;
    data.tests.glute_strength.max_right = strengthMap[extractStatus('Atividade Glúteo Máximo D') || 'Normal'] || 5;

    // Single Squat
    data.tests.single_squat.pelvic_drop_left = extractStatus('Queda Pélvica E') || "no";
    data.tests.single_squat.pelvic_drop_right = extractStatus('Queda Pélvica D') || "no";
    data.tests.single_squat.valgus_left = extractStatus('Valgo Dinâmico E') || "no";
    data.tests.single_squat.valgus_right = extractStatus('Valgo Dinâmico') || "no";

    // Shoez
    data.shoe.type = extractStatus('Calçado que Utiliza');
    data.postural.shoeSize = extractStatus('Número do Calçado');

    return data;
}
