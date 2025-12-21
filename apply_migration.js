const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
});

async function run() {
    const client = await pool.connect();
    try {
        const sqlPath = path.join(__dirname, 'migration_radar_chart.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration_radar_chart.sql...');
        await client.query(sql);
        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Error running migration:', err);
    } finally {
        client.release();
        pool.end();
    }
}

run();
