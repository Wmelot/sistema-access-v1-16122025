
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { Pool } from 'pg';

async function run() {
    console.log("Checking Env Vars:");
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    console.log("Using Connection String:", connectionString ? connectionString.substring(0, 20) + "..." : "NONE");

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log("Checking recent appointments...");
        const res = await pool.query(`
            SELECT a.id, a.status, a.patient_id, p.name as patient_name, a.organization_id
            FROM appointments a 
            LEFT JOIN patients p ON a.patient_id = p.id
            WHERE a.professional_id = '839a77d3-a7f0-4103-bc4a-004ec550bd15'
            AND a.status = 'in_progress'
        `);
        console.log(JSON.stringify(res.rows, null, 2));

        console.log("\nChecking User ID (assuming environment connects as admin/service role but we need to know the User's ID to compare)");
        // We can't easily know the user's ID here without auth context, but we can see the professional_id columns in the output.
    } catch (e) {
        console.error(e);
    }
}

run();
