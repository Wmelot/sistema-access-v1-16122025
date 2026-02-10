const { createClient } = require('@supabase/supabase-js');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://robptuukezhqvtasjyhz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4';
const ORG_ID = '9571532e-fdf8-4aaa-b236-416fd6459566';
const PROF_ID = '839a77d3-a7f0-4103-bc4a-004ec550bd15';
const PALMILHA_ORIGINAL_TEMPLATE_ID = 'a0000000-0000-0000-0000-000000000001';
const BACKUP_TEMPLATE_ID = 'e0000000-0000-0000-0000-000000000002';
const BASE_DIR = '/Users/wmelo/Axiom/clinic30490_backup_excel/';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const targetPatients = [
    { name: 'Ana Carolina Figueiredo Silva', feegowId: '1965' },
    { name: 'Ana Cristina Cândida Santos', feegowId: '2153' }
];

function cleanHtml(text) {
    if (!text) return "";
    return text
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&ccedil;/g, 'ç')
        .replace(/&Ccedil;/g, 'Ç')
        .replace(/&atilde;/g, 'ã')
        .replace(/&Atilde;/g, 'Ã')
        .replace(/&otilde;/g, 'õ')
        .replace(/&Otilde;/g, 'Õ')
        .replace(/&aacute;/g, 'á')
        .replace(/&Aacute;/g, 'Á')
        .replace(/&eacute;/g, 'é')
        .replace(/&Eacute;/g, 'É')
        .replace(/&iacute;/g, 'í')
        .replace(/&Iacute;/g, 'Í')
        .replace(/&oacute;/g, 'ó')
        .replace(/&Oacute;/g, 'Ó')
        .replace(/&uacute;/g, 'ú')
        .replace(/&Uacute;/g, 'Ú')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?[^>]+(>|$)/g, "");
}

function parseFeegowToLegacyForm(text) {
    const data = {
        hma: { qp: "", history: "", eva: [0] },
        postural: { navicular: {}, fpi_left: {}, fpi_right: {} },
        tests: {
            jack: {}, single_squat: {},
            ventral: { measures: { left: {}, right: {} }, rotation: {}, craig: {} },
            glute_strength: {}, lunge: { left: "", right: "" }
        },
        efep: [],
        history: { treatments: [] },
        shoe: {},
        plan: {}
    };

    const extractNum = (label) => {
        const regex = new RegExp(`${label}\\s*[:\\s]\\s*(-?\\d+[.,]?\\d*)`, 'i');
        const match = text.match(regex);
        return match ? parseFloat(match[1].replace(',', '.')) : undefined;
    };

    const extractStatus = (label) => {
        const regex = new RegExp(`${label}\\s*[:\\s]\\s*([^\\n\\r<]+)`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : undefined;
    };

    const qpMatch = text.match(/QP\s*[:\s]\s*([^\n]+)/i);
    if (qpMatch) data.hma.qp = qpMatch[1].trim();

    const hmaMatch = text.match(/HMA\s*[:\s]\s*([\s\S]+?)(?=\n\n|\n[A-Z][a-z]+ \d|$)/i);
    if (hmaMatch) data.hma.history = hmaMatch[1].trim();

    data.hma.eva = [extractNum('EVA Atividade') || 0];

    const efepMatches = [...text.matchAll(/Atividade (\d+)\s*\n\s*([^\n]+)\n\s*EVA Atividade\s*\n\s*(\d+)/gi)];
    efepMatches.forEach(m => {
        const index = parseInt(m[1]) - 1;
        if (!data.efep[index]) data.efep[index] = {};
        data.efep[index].activity = m[2].trim();
        data.efep[index].score = m[3];
    });

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

    data.postural.navicular.left = String(extractNum('Naviculômetro E') || "");
    data.postural.navicular.right = String(extractNum('Naviculômetro D') || "");

    data.tests.jack.left = extractStatus('Teste de Jack E') === 'Normal' ? 1 : 0;
    data.tests.jack.right = extractStatus('Teste de Jack D') === 'Normal' ? 1 : 0;

    data.tests.lunge = {
        left: String(extractNum('Lunge Teste E') || ""),
        right: String(extractNum('Lunge Teste D') || "")
    };

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

    const strengthMap = { 'Normal': 5, 'Reduzida': 3, 'Muito Reduzida': 1 };
    data.tests.glute_strength.med_left = strengthMap[extractStatus('Atividade Glúteo Médio E') || 'Normal'] || 5;
    data.tests.glute_strength.med_right = strengthMap[extractStatus('Atividade Glúteo Médio D') || 'Normal'] || 5;
    data.tests.glute_strength.max_left = strengthMap[extractStatus('Atividade Glúteo Máximo E') || 'Normal'] || 5;
    data.tests.glute_strength.max_right = strengthMap[extractStatus('Atividade Glúteo Máximo D') || 'Normal'] || 5;

    data.tests.single_squat.pelvic_drop_left = extractStatus('Queda Pélvica E') || "no";
    data.tests.single_squat.pelvic_drop_right = extractStatus('Queda Pélvica D') || "no";
    data.tests.single_squat.valgus_left = extractStatus('Valgo Dinâmico E') || "no";
    data.tests.single_squat.valgus_right = extractStatus('Valgo Dinâmico') || "no";

    data.shoe.type = extractStatus('Calçado que Utiliza');
    data.postural.shoeSize = extractStatus('Número do Calçado');

    return data;
}

function formatIsoLocal(dateStr) {
    if (!dateStr) return null;
    const iso = dateStr.trim().replace(' ', 'T');
    return `${iso}-03:00`;
}

async function run() {
    console.log("Iniciando importação solicitada...");

    for (const target of targetPatients) {
        console.log(`\nProcessando: ${target.name} (Feegow ID: ${target.feegowId})`);

        // 1. Ensure Patient exists
        let { data: pt } = await supabase.from('patients').select('id').ilike('name', target.name).eq('organization_id', ORG_ID).maybeSingle();
        if (!pt) {
            console.log(`- Criando paciente ${target.name}...`);
            const { data: newPt, error: err } = await supabase.from('patients').insert({
                name: target.name,
                organization_id: ORG_ID
            }).select('id').single();
            if (err) { console.error("Erro ao criar paciente:", err); continue; }
            pt = newPt;
        }
        const patientId = pt.id;

        // 2. Search for records in evolution files
        const files = ['_12.xlsx', '_13.xlsx', '_8.xlsx'];
        for (const file of files) {
            const filePath = path.join(BASE_DIR, file);
            if (!fs.existsSync(filePath)) continue;

            const data = xlsx.utils.sheet_to_json(xlsx.readFile(filePath).Sheets['Sheet1']);
            const records = data.filter(d => String(d.paciente_id) === target.feegowId);

            if (records.length === 0) continue;

            console.log(`- Encontrados ${records.length} registros em ${file}`);

            for (const rec of records) {
                const rawDate = rec.data_hora || rec.dhup;
                const dateISO = formatIsoLocal(rawDate);
                const rawText = rec.conteudo_resumo || "";
                const cleanContent = cleanHtml(rawText);

                // A. Biomechanics Record (Original Form)
                const biomechData = parseFeegowToLegacyForm(rawText);
                // Check if it's actually an assessment (heuristic: has some data extracted)
                if (biomechData.postural.fpi_left.talus !== "0" || biomechData.tests.lunge.left !== "") {
                    console.log(`  * Importando Biomecânica Original de ${rawDate}`);
                    const { error } = await supabase.from('patient_records').insert({
                        organization_id: ORG_ID,
                        patient_id: patientId,
                        professional_id: PROF_ID,
                        template_id: PALMILHA_ORIGINAL_TEMPLATE_ID,
                        status: 'finalized',
                        content: {
                            ...biomechData,
                            _imported: true,
                            _original_date: rawDate
                        },
                        created_at: dateISO,
                        updated_at: dateISO
                    });
                    if (error) console.error("  ! Erro ao inserir biomecânica:", error);
                }

                // B. Backup Feegow Card
                console.log(`  * Criando card Backup Feegow de ${rawDate}`);
                const { error: errBackup } = await supabase.from('patient_records').insert({
                    organization_id: ORG_ID,
                    patient_id: patientId,
                    professional_id: PROF_ID,
                    template_id: BACKUP_TEMPLATE_ID,
                    status: 'finalized',
                    content: {
                        conteudo: cleanContent,
                        _source: file
                    },
                    created_at: dateISO,
                    updated_at: dateISO
                });
                if (errBackup) console.error("  ! Erro ao inserir backup:", errBackup);
            }
        }
    }

    console.log("\nProcesso concluído!");
}

run();
