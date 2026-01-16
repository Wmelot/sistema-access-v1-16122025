
const { Client } = require('pg');
const fs = require('fs');

const legacy = new Client({
    connectionString: 'postgresql://postgres:Accessfisio%402022@db.djhipxldlkvkcrmudinv.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function searchLegacyForms() {
    try {
        await legacy.connect();
        console.log('🔍 Searching for all forms in legacy database...\n');

        // Get all forms
        const result = await legacy.query(`
            SELECT 
                id,
                title,
                description,
                type,
                is_active,
                created_at,
                updated_at,
                deleted_at
            FROM form_templates
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
        `);

        console.log(`Found ${result.rows.length} forms:\n`);

        result.rows.forEach((form, i) => {
            console.log(`${i + 1}. "${form.title}"`);
            console.log(`   Type: ${form.type || 'N/A'}`);
            console.log(`   Active: ${form.is_active}`);
            console.log(`   Created: ${form.created_at}`);
            console.log(`   ID: ${form.id}\n`);
        });

        // Save full list to file
        fs.writeFileSync(
            '/Users/wmelo/Axiom/legacy_forms_list.json',
            JSON.stringify(result.rows, null, 2)
        );
        console.log('💾 Full list saved to legacy_forms_list.json');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await legacy.end();
    }
}

searchLegacyForms();
