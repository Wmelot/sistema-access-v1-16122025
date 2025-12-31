import { NextRequest, NextResponse } from "next/server";
import { Client } from 'pg';

export async function GET(req: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
        // return NextResponse.json({ error: 'Not allowed in production without auth' }, { status: 403 });
    }

    // Attempt to load .env.local manually if not present
    if (!process.env.DATABASE_URL) {
        try {
            const fs = require('fs');
            const path = require('path');
            const dotenv = require('dotenv');

            const envLocalPath = path.resolve(process.cwd(), '.env.local');
            if (fs.existsSync(envLocalPath)) {
                console.log("Loading .env.local manually into process.env");
                const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
                for (const k in envConfig) {
                    process.env[k] = envConfig[k];
                }
            }
        } catch (e) {
            console.error("Failed to load .env.local:", e);
        }
    }

    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'; // Fallback to common local default

    if (!connectionString) {
        return NextResponse.json({ error: 'DATABASE_URL environment variable is not defined.' }, { status: 500 });
    }

    const client = new Client({
        connectionString,
    });

    try {
        await client.connect();

        await client.query(`
            ALTER TABLE report_templates DROP CONSTRAINT IF EXISTS report_templates_type_check;
            ALTER TABLE report_templates ADD CONSTRAINT report_templates_type_check 
            CHECK (type IN ('text', 'custom', 'smart_report', 'laudo', 'atestado', 'encaminhamento'));
        `);

        await client.end();
        return NextResponse.json({ success: true, message: "Migration applied successfully." });
    } catch (error: any) {
        console.error("FixDB Error:", error);
        // Serialize error object specifically
        const errorDetails = error.message || (typeof error === 'object' ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : String(error));
        return NextResponse.json({ error: errorDetails }, { status: 500 });
    }
}
