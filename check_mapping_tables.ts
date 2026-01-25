import { Client } from 'pg';

async function run() {
    const client = new Client({
        connectionString: "postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres"
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name LIKE '%organization%' OR table_name LIKE '%tenant%')
        `);
        console.log('Tables matching organization/tenant:');
        res.rows.forEach(row => console.log(`- ${row.table_name}`));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
