import { PalmilhaFormValues } from "../schemas/palmilha-schema";

/**
 * Parses a raw text string from Feegow and attempts to map it to PalmilhaFormValues.
 */
export function parseFeegowText(text: string): Partial<PalmilhaFormValues> {
    const data: any = {
        anamnese: {
            efep: [{}, {}, {}],
            historico_esportivo: {},
            historia_pregressa: {},
        },
        exame_fisico: {
            fpi: {
                talus: {},
                curvatura_maleolar: {},
                posicao_calcaneo: {},
                proeminencia_tln: {},
                congruencia_arco: {},
                abducao_antepé: {},
            },
            unipodal: {},
            mobilidade: {},
            forca_gluteo: {},
        },
        calcado: {
            indice_minimalista: {}
        },
        prescricao: {
            palmilha: {
                left_foot: {},
                right_foot: {}
            }
        }
    };

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

    // 1. ANAMNESE
    const qpMatch = text.match(/QP\s*[:\s]\s*([^\n]+)/i);
    if (qpMatch) data.anamnese.queixa_principal = qpMatch[1].trim();

    const hmaMatch = text.match(/HMA\s*[:\s]\s*([\s\S]+?)(?=\n\n|\n[A-Z][a-z]+ \d|\n[A-Z][A-Z]+|$)/i);
    if (hmaMatch) data.anamnese.hma = hmaMatch[1].trim();

    data.anamnese.eva = extractNum('EVA Atividade') || extractNum('EVA') || 0;

    // EFEP Mapping (Atividade 1, 2, 3)
    const activities = text.matchAll(/Atividade (\d)\s*[:\s]*([^\n]+?)\s*EVA Atividade\s*[:\s]*(\d+)/gi);
    let idx = 0;
    for (const match of activities) {
        if (idx < 3) {
            data.anamnese.efep[idx] = { atividade: match[2].trim(), nota: parseInt(match[3]) };
            idx++;
        }
    }

    // 2. EXAME FISICO - FPI
    data.exame_fisico.fpi.talus.left = extractStatus('Tálus E');
    data.exame_fisico.fpi.talus.right = extractStatus('Tálus D');

    // Position 2: Curves
    data.exame_fisico.fpi.curvatura_maleolar.left = extractStatus('Calcâneo E');
    data.exame_fisico.fpi.curvatura_maleolar.right = extractStatus('Calcâneo D');

    // Position 3 & 4: Navicular labels usually appear twice in order
    const navicularMatchesE = [...text.matchAll(/Navicular E\s*(?::\s*|\r?\n)\s*([^\n\r<]+)/gi)];
    const navicularMatchesD = [...text.matchAll(/Navicular D\s*(?::\s*|\r?\n)\s*([^\n\r<]+)/gi)];

    data.exame_fisico.fpi.posicao_calcaneo.left = navicularMatchesE[0]?.[1]?.trim();
    data.exame_fisico.fpi.posicao_calcaneo.right = navicularMatchesD[0]?.[1]?.trim();

    data.exame_fisico.fpi.proeminencia_tln.left = navicularMatchesE[1]?.[1]?.trim();
    data.exame_fisico.fpi.proeminencia_tln.right = navicularMatchesD[1]?.[1]?.trim();

    data.exame_fisico.fpi.congruencia_arco.left = extractStatus('Arco E');
    data.exame_fisico.fpi.congruencia_arco.right = extractStatus('Arco D');

    data.exame_fisico.fpi.abducao_antepé.left = extractStatus('Dedos E') || extractStatus('Abdução E');
    data.exame_fisico.fpi.abducao_antepé.right = extractStatus('Dedos D') || extractStatus('Abdução D');

    // 3. TESTES CLINICOS
    data.exame_fisico.jack_test = {
        left: extractStatus('Jack E') || extractStatus('Jack Test E'),
        right: extractStatus('Jack D') || extractStatus('Jack Test D')
    };

    data.exame_fisico.lunge_test = {
        left: extractNum('Lunge E') || extractNum('Lunge Teste E'),
        right: extractNum('Lunge D') || extractNum('Lunge Teste D')
    };

    data.exame_fisico.navicular_drop = {
        left: extractNum('Naviculômetro E') || extractNum('Navicular E'),
        right: extractNum('Naviculômetro D') || extractNum('Navicular D')
    };

    data.exame_fisico.thomas_test = {
        left: extractNum('Thomas E'),
        right: extractNum('Thomas D')
    };

    data.exame_fisico.psoas = {
        left: extractNum('Psoas E'),
        right: extractNum('Psoas D')
    };

    data.exame_fisico.isquiotibiais = {
        left: extractNum('Isquio E') || extractNum('Isquiotibiais E'),
        right: extractNum('Isquio D') || extractNum('Isquiotibiais D')
    };

    data.exame_fisico.craig_anteversao = {
        left: extractNum('Craig E'),
        right: extractNum('Craig D')
    };

    data.exame_fisico.apa = {
        left: extractNum('APA E'),
        right: extractNum('APA D')
    };

    data.exame_fisico.retrope = {
        left: extractNum('Retropé E'),
        right: extractNum('Retropé D')
    };

    data.exame_fisico.antepe_livre = {
        left: extractNum('Antepé Livre E'),
        right: extractNum('Antepé Livre D')
    };

    // UNIPODAL
    data.exame_fisico.unipodal.queda_pelvica = {
        left: extractStatus('Queda Pélvica E'),
        right: extractStatus('Queda Pélvica D')
    };
    data.exame_fisico.unipodal.valgo_dinamico = {
        left: extractStatus('Valgo Dinâmico E'),
        right: extractStatus('Valgo Dinâmico D') || extractStatus('Valgo Dinâmico')
    };

    // GLUTE STRENGTH
    data.exame_fisico.forca_gluteo = {
        medio: {
            left: extractStatus('Glúteo Médio E') || extractStatus('Força Glúteo Médio E'),
            right: extractStatus('Glúteo Médio D') || extractStatus('Força Glúteo Médio D')
        },
        maximo: {
            left: extractStatus('Glúteo Máximo E') || extractStatus('Força Glúteo Máximo E'),
            right: extractStatus('Glúteo Máximo D') || extractStatus('Força Glúteo Máximo D')
        }
    };

    // 4. CALCADO
    data.calcado.modelo = extractStatus('Calçado que Utiliza') || extractStatus('Tênis');
    data.calcado.tamanho = String(extractNum('Número do Calçado') || extractStatus('Número do Calçado') || extractStatus('Numeração') || "");

    const sportsText = extractStatus('Atividade Física Regular');
    if (sportsText) {
        data.anamnese.historico_esportivo.atividades = sportsText.split(';').map(s => s.trim()).filter(Boolean);
    }

    // Clean up empty objects
    Object.keys(data.exame_fisico).forEach(key => {
        if (typeof data.exame_fisico[key] === 'object' && Object.values(data.exame_fisico[key]).every(v => v === undefined)) {
            delete data.exame_fisico[key];
        }
    });

    return data;
}
