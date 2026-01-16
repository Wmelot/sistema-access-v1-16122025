
const { Client } = require('pg');

const legacy = new Client({
    connectionString: 'postgresql://postgres:Accessfisio%402022@db.djhipxldlkvkcrmudinv.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function searchAllTables() {
    try {
        await legacy.connect();

        // Search for tables with 'question' or 'scale' in name
        const tables = await legacy.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND (
                table_name ILIKE '%question%' 
                OR table_name ILIKE '%scale%'
                OR table_name ILIKE '%survey%'
                OR table_name ILIKE '%quiz%'
            )
        `);

        console.log('Tables related to questionnaires:');
        tables.rows.forEach(t => console.log(`  - ${t.table_name}`));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await legacy.end();
    }
}

searchAllTables();
