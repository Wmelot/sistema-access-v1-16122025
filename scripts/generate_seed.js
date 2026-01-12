const fs = require('fs');
const path = require('path');

const evidencePath = path.join(__dirname, '../legacy_dump/src/lib/services/smart-reports/evidence/database.json');
const biomechanicsPath = path.join(__dirname, '../legacy_dump/src/components/assessments/biomechanics-form.tsx');
const physicalPath = path.join(__dirname, '../legacy_dump/src/components/assessments/physical-assessment-form.tsx');
const seedPath = path.join(__dirname, '../supabase/seeds/import_legacy_data.sql');

let sql = `-- Seed mapped from Legacy Data\n\n`;

// 1. Evidence
if (fs.existsSync(evidencePath)) {
    const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
    if (evidence.entries && evidence.entries.length > 0) {
        sql += `-- Evidence Data\n`;
        evidence.entries.forEach(entry => {
            const keywords = JSON.stringify(entry.keywords).replace(/'/g, "''"); // Postgres array literal is usually string, but here we can pass array literal
            const ev = entry.evidence.replace(/'/g, "''");
            const src = entry.source.replace(/'/g, "''");
            // format text[] array literal: {'kw1','kw2'}
            const pgKeywords = `{${entry.keywords.map(k => `"${k}"`).join(',')}}`;

            sql += `INSERT INTO public.clinical_knowledge (keywords, evidence, source) VALUES ('${pgKeywords}', '${ev}', '${src}');\n`;
        });
        sql += `\n`;
    }
}

// 2. Forms Mappings
// We will manually construct the JSON fields based on inspection, as extracting from TSX AST is complex in a simple script.
// Biomechanics Form Template
const biomechanicsFields = [
    { id: 'qp', label: 'Queixa Principal', type: 'textarea', section: 'Anamnese' },
    { id: 'hma', label: 'História da Moléstia Atual', type: 'textarea', section: 'Anamnese' },
    { id: 'painDuration', label: 'Duração da Dor', type: 'text', section: 'Anamnese' },
    { id: 'eva', label: 'Escala de Dor (EVA)', type: 'number', min: 0, max: 10, section: 'Anamnese' },
    { id: 'history.hp', label: 'História Patológica Pregressa', type: 'textarea', section: 'Histórico' },
    { id: 'history.medication', label: 'Medicamentos em Uso', type: 'textarea', section: 'Histórico' }
];

const physicalFields = [
    { id: 'antro.weight', label: 'Peso (kg)', type: 'number', section: 'Antropometria' },
    { id: 'antro.height', label: 'Altura (cm)', type: 'number', section: 'Antropometria' },
    { id: 'cardio.method', label: 'Protocolo Cardio', type: 'select', options: ['rockport', 'cooper'], section: 'Cardio' },
    { id: 'anamnesis.mainComplaint', label: 'Queixa Principal', type: 'textarea', section: 'Anamnese' }
];

sql += `-- Form Templates\n`;
// Insert Biomechanics
sql += `INSERT INTO public.form_templates (title, description, fields) VALUES (
    'Avaliação Biomecânica (Legacy)', 
    'Imported from Legacy System v1', 
    '${JSON.stringify(biomechanicsFields)}'::jsonb
);\n`;

// Insert Physical
sql += `INSERT INTO public.form_templates (title, description, fields) VALUES (
    'Avaliação Física (Legacy)', 
    'Imported from Legacy System v1', 
    '${JSON.stringify(physicalFields)}'::jsonb
);\n`;

fs.writeFileSync(seedPath, sql);
console.log('Seed file generated at ' + seedPath);
