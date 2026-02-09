import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';

const directUrl = "postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres";

async function run() {
    const client = new Client({ connectionString: directUrl });
    try {
        await client.connect();
        console.log("Connected to database. Reading migration...");
        const sql = readFileSync('/Users/wmelo/Axiom/supabase/migrations/20270206000000_cleanup_and_fix_fees.sql', 'utf8');

        console.log("Executing SQL...");
        await client.query(sql);
        console.log("SQL executed successfully!");
    } catch (err) {
        console.error("Error executing SQL:", err);
    } finally {
        await client.end();
    }
}

run();
