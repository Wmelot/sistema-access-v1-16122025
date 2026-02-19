const { Pool } = require("pg");
const pool = new Pool({
  connectionString: "postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const tables = ['organization_form_access', 'form_templates', 'organizations'];
  for (const table of tables) {
    const res = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table}'`);
    console.log(`${table}:`, JSON.stringify(res.rows, null, 2));
  }
  process.exit();
}
check();
