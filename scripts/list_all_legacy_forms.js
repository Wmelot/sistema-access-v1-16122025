
const { Client } = require('pg');

const legacy = new Client({
    connectionString: 'postgresql://postgres:Accessfisio%402022@db.djhipxldlkvkcrmudinv.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function findAllForms() {
    try {
        await legacy.connect();

        const forms = await legacy.query(`
            SELECT 
                id, 
                title, 
                jsonb_array_length(fields) as field_count,
                created_at,
                updated_at,
                is_active,
                deleted_at
            FROM form_templates 
            ORDER BY jsonb_array_length(fields) DESC NULLS LAST
        `);

        console.log('All Forms in Legacy Database:\n');
        forms.rows.forEach((f, i) => {
            console.log(`${i + 1}. "${f.title}"`);
            console.log(`   Fields: ${f.field_count || 0}`);
            console.log(`   Active: ${f.is_active}`);
            console.log(`   Deleted: ${f.deleted_at ? 'Yes' : 'No'}`);
            console.log(`   ID: ${f.id}\n`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await legacy.end();
    }
}

findAllForms();
