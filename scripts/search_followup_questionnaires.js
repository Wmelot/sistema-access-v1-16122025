
const { Client } = require('pg');

const legacy = new Client({
    connectionString: 'postgresql://postgres:Accessfisio%402022@db.djhipxldlkvkcrmudinv.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function searchFollowUpQuestionnaires() {
    try {
        await legacy.connect();
        console.log('🔍 Searching for follow-up/satisfaction questionnaires...\n');

        const result = await legacy.query(`
            SELECT id, title, type, description, is_active, created_at
            FROM form_templates
            WHERE 
                (title ILIKE '%acompanhamento%' OR
                title ILIKE '%follow%' OR
                title ILIKE '%satisfação%' OR
                title ILIKE '%qualidade%' OR
                title ILIKE '%atendimento%' OR
                title ILIKE '%palmilha%' OR
                title ILIKE '%adaptação%' OR
                title ILIKE '%feedback%')
                AND title NOT ILIKE '%biomecânica%'
                AND title NOT ILIKE '%pé insensível%'
            ORDER BY title
        `);

        console.log(`Found ${result.rows.length} potential follow-up questionnaires:\n`);

        result.rows.forEach((f, i) => {
            console.log(`${i + 1}. "${f.title}"`);
            console.log(`   Type: ${f.type}`);
            console.log(`   Active: ${f.is_active}`);
            console.log(`   Created: ${f.created_at}`);
            console.log(`   ID: ${f.id}\n`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await legacy.end();
    }
}

searchFollowUpQuestionnaires();
