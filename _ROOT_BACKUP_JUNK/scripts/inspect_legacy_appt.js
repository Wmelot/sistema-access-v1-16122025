
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Accessfisio%402022@db.djhipxldlkvkcrmudinv.supabase.co:5432/postgres';

async function inspectAppt() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        const res = await client.query('SELECT date, start_time FROM appointments LIMIT 5');
        console.log('Sample Data:');
        res.rows.forEach(r => {
            console.log(`Date Type: ${typeof r.date}, Value:`, r.date);
            console.log(`Time Type: ${typeof r.start_time}, Value:`, r.start_time);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

inspectAppt();
