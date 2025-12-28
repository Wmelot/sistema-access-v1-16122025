
const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
});

async function check() {
    try {
        await client.connect();

        // Check api_integrations columns
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'api_integrations'
    `);

        console.log("Columns in api_integrations:", res.rows);

        // Check RLS Policies
        const policies = await client.query(`
      SELECT schemaname, tablename, policyname, cmd, roles 
      FROM pg_policies 
      WHERE tablename = 'api_integrations'
    `);
        console.log("Policies on api_integrations:", policies.rows);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

check();
