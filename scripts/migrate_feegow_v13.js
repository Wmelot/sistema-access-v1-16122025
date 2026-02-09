const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const SUPABASE_URL = "https://robptuukezhqvtasjyhz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const base_path = "/Users/wmelo/Axiom/clinic30490_backup_excel/";

function loadSheet(file) {
    if (!fs.existsSync(path.join(base_path, file))) return [];
    try {
        const wb = xlsx.readFile(path.join(base_path, file));
        return xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: false });
    } catch (e) { return []; }
}

function normalize(str) {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
}

const ORG_ID = "9571532e-fdf8-4aaa-b236-416fd6459566";
const PALMILHA_V3_ID = 'fde183ad-1c20-4d6c-9efb-89d08f483cf2';
const BACKUP_TEMPLATE_ID = 'e0000000-0000-0000-0000-000000000002'; // Evolution/Text

const AXIOM_PROF_MAP = {
    "1": "839a77d3-a7f0-4103-bc4a-004ec550bd15",
    "2": "895dfdde-a6d6-4d29-97e8-626b9deb16b8",
    "3": "64c95a02-04ce-4ace-b63f-b4210cf282a9",
    "4": "5dd90d13-be69-4718-8cd8-cb1a9737a7b8"
};

function cleanHtml(text) {
    if (!text) return "";
    let decoded = text
        .replace(/&nbsp;/gd, ' ')
        .replace(/&quot;/gd, '"')
        .replace(/&apos;/gd, "'")
        .replace(/&lt;/gd, '<')
        .replace(/&gt;/gd, '>')
        .replace(/&amp;/gd, '&')
        .replace(/&ccedil;/gd, 'ç')
        .replace(/&Ccedil;/gd, 'Ç')
        .replace(/&atilde;/gd, 'ã')
        .replace(/&Atilde;/gd, 'Ã')
        .replace(/&otilde;/gd, 'õ')
        .replace(/&Otilde;/gd, 'Õ')
        .replace(/&aacute;/gd, 'á')
        .replace(/&Aacute;/gd, 'Á')
        .replace(/&eacute;/gd, 'é')
        .replace(/&Eacute;/gd, 'É')
        .replace(/&iacute;/gd, 'í')
        .replace(/&Iacute;/gd, 'Í')
        .replace(/&oacute;/gd, 'ó')
        .replace(/&Oacute;/gd, 'Ó')
        .replace(/&uacute;/gd, 'ú')
        .replace(/&Uacute;/gd, 'Ú')
        .replace(/&acirc;/gd, 'â')
        .replace(/&Acirc;/gd, 'Â')
        .replace(/&ecirc;/gd, 'ê')
        .replace(/&Ecirc;/gd, 'Ê')
        .replace(/&ocirc;/gd, 'ô')
        .replace(/&Ocirc;/gd, 'Ô')
        .replace(/<sup>/gi, '^')
        .replace(/<\/sup>/gi, '')
        .replace(/<sub>/gi, '_')
        .replace(/<\/sub>/gi, '');

    let clean = decoded
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/style="[^"]*"/gi, '')
        .replace(/\n\s*\n/g, '\n\n');

    return clean.trim();
}

function extractVal(text, key) {
    // Regex flexible for ": key" or "key :" and value
    // e.g., "Tálus E : 2" or "Lunge Teste E : 40"
    // Also handles line breaks

    // Attempt 1: "Key : Value"
    const regex = new RegExp(`${key}\\s*:\\s*([-+]?[0-9,.]+)`, 'i');
    const match = text.match(regex);
    if (match) return match[1].replace(',', '.');

    return null;
}

function parseBiomechanicsText(text) {
    if (!text) return null;
    const clean = cleanHtml(text);

    // Check if it's actually Biomechanics data
    if (!clean.includes("FPI") && !clean.includes("Lunge")) return null;

    const mapFpi = (val) => val ? String(parseInt(val)) : "0";
    const mapNum = (val) => val ? parseFloat(val) : 0;

    const data = {
        anamnese: {
            queixa_principal: "Avaliação Biomecânica (Importada)",
            hma: clean, // Keep full text here!
            eva: 0,
            historia_pregressa: { medicacao_uso: "", tratamentos_previos: [] },
            mapa_dor: { pontos: [] }
        },
        exame_fisico: {
            fpi: {
                talus: {
                    left: mapFpi(extractVal(clean, "Tálus E")),
                    right: mapFpi(extractVal(clean, "Tálus D"))
                },
                curvatura_maleolar: {
                    left: mapFpi(extractVal(clean, "Maléolo E")),
                    right: mapFpi(extractVal(clean, "Maléolo D"))
                },
                posicao_calcaneo: {
                    left: mapFpi(extractVal(clean, "Calcâneo E")),
                    right: mapFpi(extractVal(clean, "Calcâneo D"))
                },
                proeminencia_tln: {
                    left: mapFpi(extractVal(clean, "Navicular E")),
                    right: mapFpi(extractVal(clean, "Navicular D"))
                },
                congruencia_arco: {
                    left: mapFpi(extractVal(clean, "Arco E")),
                    right: mapFpi(extractVal(clean, "Arco D"))
                },
                abducao_antepé: {
                    left: mapFpi(extractVal(clean, "Dedos E")),
                    right: mapFpi(extractVal(clean, "Dedos D"))
                },
                // Also capture totals if present? Form calculates it automatically.
            },
            lunge_test: {
                left: mapNum(extractVal(clean, "Lunge Teste E")),
                right: mapNum(extractVal(clean, "Lunge Teste D"))
            },
            navicular_drop: {
                // "Naviculômetro" is not in the text usually? Wait, Step 2298 showed Lunge only.
                // Step 2325 showed FPI.
                // If present:
                left: mapNum(extractVal(clean, "Naviculômetro E")),
                right: mapNum(extractVal(clean, "Naviculômetro D"))
            },
            discrepancia_membros: {
                left: mapNum(extractVal(clean, "Comprimento MIE")),
                right: mapNum(extractVal(clean, "Comprimento MID"))
            }
        },
        calcado: {
            indice_minimalista: { peso_score: 0, drop_score: 0, flex_longitudinal: 0, flex_torsional: 0, estabilidade: 0 }
        },
        prescricao: {
            palmilha: {
                modelo: "Slim",
                tipo: "Inteira",
                left_foot: { pads: [] },
                right_foot: { pads: [] }
            },
            preco_total: 0
        }
    };

    return data;
}

function formatIsoLocalStringShifted(dateStrRaw) {
    if (!dateStrRaw) return null;
    const parts = dateStrRaw.replace('T', ' ').split(' ');
    const dateParts = parts[0].split('-');
    const timeParts = parts[1].split(':');

    let year = parseInt(dateParts[0]);
    let month = parseInt(dateParts[1]) - 1;
    let day = parseInt(dateParts[2]);
    let hour = parseInt(timeParts[0]);
    let min = parseInt(timeParts[1]);
    let sec = parseInt(timeParts[2] || '0');

    hour += 3; // Shift +3h

    const d = new Date(year, month, day, hour, min, sec);

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');

    return `${y}-${m}-${dd}T${hh}:${mm}:${ss}-03:00`;
}

async function migrate() {
    console.log("Iniciando migração v13 (Evolution Text Parsing -> Biomechanics Form)...");

    const targetNames = ["Adaliana Bastos dos Santos Rodrigues", "Adriana Paula da Cruz Barreto"];
    const ptsData = loadSheet("pacientes.xlsx");
    const formsData = ["_8.xlsx", "_12.xlsx", "_13.xlsx"].map(src => ({ src, data: loadSheet(src) }));

    // 1. DELETE EXISTING RECORDS for Target Patients
    // We wipe cleanup to start fresh
    for (const name of targetNames) {
        const { data: pt } = await supabase.from('patients').select('id').eq('name', name).maybeSingle();
        if (pt) {
            await supabase.from('patient_records').delete().eq('patient_id', pt.id);
            console.log(`- Limpou registros de ${name}`);
        }
    }

    // 2. PROCESS RECORDS
    for (const name of targetNames) {
        const p = ptsData.find(pt => normalize(pt.nome_paciente) === normalize(name));
        if (!p) continue;

        const { data: axiomPt } = await supabase.from('patients').select('id').eq('name', p.nome_paciente).single();
        if (!axiomPt) continue;
        const patientId = axiomPt.id;

        for (const { src, data } of formsData) {
            const records = data.filter(e => String(e.paciente_id) === String(p.id));
            if (records.length > 0) {
                for (const rec of records) {
                    const profId = AXIOM_PROF_MAP[String(rec.profissionail_id)] || AXIOM_PROF_MAP["1"];
                    const dateRaw = rec.data_hora || rec.dhup;
                    const dateISO = formatIsoLocalStringShifted(dateRaw);
                    const cleanContent = cleanHtml(rec.conteudo_resumo);

                    // A. Check if it's Biomechanics
                    const biomechData = parseBiomechanicsText(rec.conteudo_resumo); // Use RAW text for cleaner regex parsing inside func? No, use raw.

                    if (biomechData) {
                        // IT IS BIOMECHANICS! Import as Palmilha V3
                        await supabase.from('patient_records').insert({
                            organization_id: ORG_ID,
                            patient_id: patientId,
                            professional_id: profId,
                            template_id: PALMILHA_V3_ID, // V3 Form
                            status: 'finalized',
                            content: {
                                ...biomechData,
                                _imported_from_feegow: true,
                                _original_text: cleanContent
                            },
                            created_at: dateISO, updated_at: dateISO
                        });
                        console.log(`- [${name}] Importou Palmilha Biomecânica (Parseada do Texto)`);
                    } else {
                        // IT IS JUST EVOLUTION (Backup Feegow)
                        if (!cleanContent) continue;
                        await supabase.from('patient_records').insert({
                            organization_id: ORG_ID,
                            patient_id: patientId,
                            professional_id: profId,
                            template_id: BACKUP_TEMPLATE_ID, // Backup Feegow
                            status: 'finalized',
                            content: {
                                conteudo: cleanContent,
                                _source: src
                            },
                            created_at: dateISO, updated_at: dateISO
                        });
                        console.log(`- [${name}] Importou Evolução (Backup Feegow)`);
                    }
                }
            }
        }
    }

    console.log("Migração v13 concluída!");
}

migrate();
