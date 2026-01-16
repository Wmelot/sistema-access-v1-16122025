
const { Client } = require('pg');

// New URL URL: djhipxldlkvkcrmudinv
const connectionString = 'postgresql://postgres:Accessfisio%402022@db.djhipxldlkvkcrmudinv.supabase.co:5432/postgres';

async function test() {
    console.log('Testing connection to LEGACY DB:', connectionString.replace(/:[^:@]*@/, ':****@'));
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        console.log('Connected to Legacy DB!');

        // Check key tables
        const queries = [
            'SELECT count(*) as count FROM profiles',
            'SELECT count(*) as count FROM appointments',
            'SELECT count(*) as count FROM patients',
            'SELECT count(*) as count FROM services'
        ];

        for (const q of queries) {
            try {
                const res = await client.query(q);
                console.log(`${q}: ${res.rows[0].count}`);
            } catch (e) {
                console.log(`${q}: Error - ${e.message}`);
            }
        }

    } catch (err) {
        console.error('Connection failed:', err.message);
    } finally {
        await client.end();
    }
}

test();
