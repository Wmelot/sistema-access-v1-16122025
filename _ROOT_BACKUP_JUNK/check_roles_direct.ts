
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: "postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log("Checking roles table...");
        const res = await pool.query("SELECT * FROM roles");
        console.log("Roles found:", res.rows);

        const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'roles'");
        console.log("Columns:", cols.rows.map(r => r.column_name));

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
