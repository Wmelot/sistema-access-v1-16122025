
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Mimic src/lib/db.ts
let connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || '';
console.log("Connection String:", connectionString.replace(/:[^:@]*@/, ':****@')); // Hide password

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
});

async function testGetPatients() {
    const orgId = '9571532e-fdf8-4aaa-b236-416fd6459566'; // From previous step
    console.log(`Testing query for Org: ${orgId}`);

    try {
        const sql = `SELECT id, name FROM patients WHERE organization_id = $1 LIMIT 5`;
        const { rows } = await pool.query(sql, [orgId]);
        console.log("Rows returned:", rows);
    } catch (e) {
        console.error("Query failed:", e);
    } finally {
        await pool.end();
    }
}

testGetPatients();
