const { Client } = require('pg');
const client = new Client({
    connectionString: 'postgresql://postgres.robptuukezhqvtasjyhz:0xw8SnQc09fHn7S4@aws-0-sa-east-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    await client.connect();
    const res = await client.query("SELECT enum_range(NULL::appointment_status)");
    console.log(res.rows[0]);
    await client.end();
}
run();
