
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Accessfisio%402022@db.djhipxldlkvkcrmudinv.supabase.co:5432/postgres';

async function checkFinancialData() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();

        const tables = [
            'financial_commissions',
            'financial_payables',
            'payment_method_fees',
            'professional_commission_rules',
            'invoice_items'
        ];

        for (const table of tables) {
            try {
                const count = await client.query(`SELECT COUNT(*) as total FROM ${table}`);
                console.log(`${table}: ${count.rows[0].total} records`);

                if (parseInt(count.rows[0].total) > 0) {
                    const sample = await client.query(`SELECT * FROM ${table} LIMIT 1`);
                    console.log(`  Sample:`, sample.rows[0]);
                }
            } catch (e) {
                console.log(`${table}: Error - ${e.message}`);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkFinancialData();
