
const { Client } = require('pg');

const legacy = new Client({
    connectionString: 'postgresql://postgres:Accessfisio%402022@db.djhipxldlkvkcrmudinv.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function searchDRE() {
    try {
        await legacy.connect();

        // Search for DRE in table names
        const tables = await legacy.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name ILIKE '%dre%' OR table_name ILIKE '%resultado%' OR table_name ILIKE '%demonstr%')
        `);

        console.log('Tables related to DRE:');
        console.table(tables.rows);

        // Search for DRE in views
        const views = await legacy.query(`
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public' 
            AND (table_name ILIKE '%dre%' OR table_name ILIKE '%resultado%')
        `);

        console.log('\nViews related to DRE:');
        console.table(views.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await legacy.end();
    }
}

searchDRE();
