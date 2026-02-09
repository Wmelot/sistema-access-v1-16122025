import pkg from 'pg';
const { Client } = pkg;

const directUrl = "postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres";

async function run() {
    const client = new Client({ connectionString: directUrl });
    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'profiles'
        `);
        console.log("Profiles Columns:", JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

run();
