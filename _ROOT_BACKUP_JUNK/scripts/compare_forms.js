
const { Client } = require('pg');

const legacy = new Client({
    connectionString: 'postgresql://postgres:Accessfisio%402022@db.djhipxldlkvkcrmudinv.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function compareForms() {
    try {
        await legacy.connect();

        // Check form_templates table
        const templates = await legacy.query(`
            SELECT id, name, type, structure 
            FROM form_templates 
            WHERE name ILIKE '%clínica%' OR name ILIKE '%inteligente%'
        `);

        console.log('Legacy Form Templates:');
        templates.rows.forEach(t => {
            console.log(`\nID: ${t.id}`);
            console.log(`Name: ${t.name}`);
            console.log(`Type: ${t.type}`);
            console.log(`Structure Length: ${JSON.stringify(t.structure).length} chars`);
        });

        // Also check patient_assessments for structure
        const assessments = await legacy.query(`
            SELECT DISTINCT type, COUNT(*) as count
            FROM patient_assessments
            GROUP BY type
        `);

        console.log('\n\nAssessment Types in Legacy:');
        console.table(assessments.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await legacy.end();
    }
}

compareForms();
