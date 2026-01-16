
const { Client } = require('pg');

const legacy = new Client({
    connectionString: 'postgresql://postgres:Accessfisio%402022@db.djhipxldlkvkcrmudinv.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function inspectForms() {
    try {
        await legacy.connect();

        // First check what columns exist
        const cols = await legacy.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'form_templates'
        `);

        console.log('form_templates columns:');
        console.table(cols.rows);

        // Get all form templates
        const templates = await legacy.query('SELECT * FROM form_templates LIMIT 5');

        console.log('\nLegacy Form Templates:');
        templates.rows.forEach(t => {
            console.log(`\nTemplate:`, t);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await legacy.end();
    }
}

inspectForms();
