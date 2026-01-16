
const { Client } = require('pg');

const legacy = new Client({
    connectionString: 'postgresql://postgres:Accessfisio%402022@db.djhipxldlkvkcrmudinv.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function findLegacyQuestionnaires() {
    try {
        await legacy.connect();
        console.log('🔍 Searching for questionnaires in legacy database...\n');

        const result = await legacy.query(`
            SELECT 
                id,
                title,
                type,
                description,
                is_active,
                created_at
            FROM form_templates
            WHERE deleted_at IS NULL
            ORDER BY type, created_at DESC
        `);

        console.log(`Found ${result.rows.length} forms total:\n`);

        const byType = {};
        result.rows.forEach(form => {
            const type = form.type || 'unknown';
            if (!byType[type]) byType[type] = [];
            byType[type].push(form);
        });

        Object.keys(byType).forEach(type => {
            console.log(`\n📋 ${type.toUpperCase()} (${byType[type].length}):`);
            byType[type].forEach((form, i) => {
                console.log(`  ${i + 1}. "${form.title}"`);
                console.log(`     ID: ${form.id}`);
                console.log(`     Active: ${form.is_active}`);
            });
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await legacy.end();
    }
}

findLegacyQuestionnaires();
