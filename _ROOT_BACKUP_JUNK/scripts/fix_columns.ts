import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local manually to ensure we get the secrets
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    console.log(`Loading env from ${envPath}`);
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} else {
    console.log(".env.local not found, relying on process.env");
}

async function main() {
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!dbUrl) {
        console.error("FATAL: No DATABASE_URL or POSTGRES_URL found in .env.local");
        console.log("Found keys:", Object.keys(process.env).filter(k => k.includes('URL') || k.includes('DB')));
        process.exit(1);
    }

    console.log("Connecting to Database...");
    // Mask password in log
    console.log("URL:", dbUrl.replace(/:[^:]+@/, ':****@'));

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false } // Required for Supabase Remote
    });

    try {
        await client.connect();
        console.log("Connected successfully!");

        console.log("Executing schema updates...");

        // Add is_unlimited
        await client.query(`
            ALTER TABLE public.products 
            ADD COLUMN IF NOT EXISTS is_unlimited BOOLEAN DEFAULT FALSE;
        `);
        console.log("Success: Added 'is_unlimited' column.");

        // Add cost_price
        await client.query(`
            ALTER TABLE public.products 
            ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0;
        `);
        console.log("Success: Added 'cost_price' column.");

    } catch (err) {
        console.error("Error executing SQL:", err);
    } finally {
        await client.end();
        console.log("Done.");
    }
}

main().catch(console.error);
