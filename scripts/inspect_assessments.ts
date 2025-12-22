import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

async function main() {
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!dbUrl) {
        console.error("No DATABASE_URL found.");
        process.exit(1);
    }

    const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

    try {
        await client.connect();
        console.log("Connected to DB.");

        // Check if table exists
        const tableCheck = await client.query(`
            SELECT to_regclass('public.patient_assessments');
        `);

        if (!tableCheck.rows[0].to_regclass) {
            console.log("Table 'patient_assessments' DOES NOT EXIST.");
            return;
        }

        // Count rows
        const count = await client.query('SELECT count(*) FROM patient_assessments');
        console.log("Total Assessments (Superuser):", count.rows[0].count);

        // Fetch last 5
        const rows = await client.query('SELECT * FROM patient_assessments ORDER BY created_at DESC LIMIT 5');
        console.log("Last 5 Assessments:", JSON.stringify(rows.rows, null, 2));

        // Check Policies
        const policies = await client.query(`
            SELECT * FROM pg_policies WHERE tablename = 'patient_assessments';
        `);
        console.log("Policies:", policies.rows.map(p => p.policyname));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

main().catch(console.error);
