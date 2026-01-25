import { Client } from 'pg';

async function run() {
    const client = new Client({
        connectionString: "postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres"
    });

    try {
        await client.connect();
        const res = await client.query('SELECT name, slug FROM plan_configs');
        console.log('Existing plans:');
        res.rows.forEach(row => console.log(`- ${row.name} (${row.slug})`));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
