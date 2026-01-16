
const { Client } = require('pg');

const legacy = new Client({
    connectionString: 'postgresql://postgres:Accessfisio%402022@db.djhipxldlkvkcrmudinv.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function searchStandardizedQuestionnaires() {
    try {
        await legacy.connect();
        console.log('🔍 Searching for standardized questionnaires (DASH, AOFAS, etc)...\n');

        // Search in form_templates
        const forms = await legacy.query(`
            SELECT id, title, type, description, is_active
            FROM form_templates
            WHERE 
                title ILIKE '%DASH%' OR
                title ILIKE '%AOFAS%' OR
                title ILIKE '%Roland%' OR
                title ILIKE '%Morris%' OR
                title ILIKE '%palmilha%' OR
                title ILIKE '%questionário%' OR
                title ILIKE '%escala%' OR
                title ILIKE '%avaliação%'
            ORDER BY title
        `);

        console.log(`Found ${forms.rows.length} forms:\n`);
        forms.rows.forEach((f, i) => {
            console.log(`${i + 1}. "${f.title}"`);
            console.log(`   Type: ${f.type}`);
            console.log(`   Active: ${f.is_active}`);
            console.log(`   ID: ${f.id}\n`);
        });

        // Also check if there's a separate questionnaires table
        const tables = await legacy.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        console.log('\n📋 All tables in legacy database:');
        tables.rows.forEach(t => console.log(`  - ${t.table_name}`));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await legacy.end();
    }
}

searchStandardizedQuestionnaires();
