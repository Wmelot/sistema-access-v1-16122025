
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Accessfisio%402022@db.djhipxldlkvkcrmudinv.supabase.co:5432/postgres';

async function checkFinance() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        console.log('Checking Finance & Messages tables...');

        const tables = [
            'invoices',
            'transactions',
            'financial_categories',
            'message_templates',
            'campaign_messages'
        ];

        for (const t of tables) {
            try {
                const res = await client.query(`SELECT count(*) as count FROM ${t}`);
                console.log(`${t}: ${res.rows[0].count}`);
            } catch (e) {
                console.log(`${t}: Not found or error (${e.message})`);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkFinance();
