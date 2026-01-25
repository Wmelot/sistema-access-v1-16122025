import { Client } from 'pg';

async function run() {
    const client = new Client({
        connectionString: "postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres"
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user_authenticators'
        `);
        console.log('Columns in user_authenticators:');
        res.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));

        const countRes = await client.query('SELECT count(*) FROM user_authenticators');
        console.log('Total rows:', countRes.rows[0].count);
        
        const lastRows = await client.query('SELECT * FROM user_authenticators ORDER BY created_at DESC LIMIT 1');
        console.log('Last inserted row (if any):', lastRows.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
