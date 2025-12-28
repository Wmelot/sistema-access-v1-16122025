import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            // 1. Check if table exists
            await client.query(`
                CREATE TABLE IF NOT EXISTS public.api_integrations (
                    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                    provider text NOT NULL UNIQUE,
                    is_active boolean DEFAULT false,
                    config jsonb DEFAULT '{}'::jsonb,
                    created_at timestamptz DEFAULT now(),
                    updated_at timestamptz DEFAULT now()
                );
            `);

            // 2. Add column if missing
            await client.query('ALTER TABLE public.api_integrations ADD COLUMN IF NOT EXISTS config jsonb DEFAULT \'{}\'::jsonb;');

            // 3. Enable RLS
            await client.query('ALTER TABLE public.api_integrations ENABLE ROW LEVEL SECURITY;');

            // 4. Reload Schema Cache (Critical for PostgREST)
            await client.query("NOTIFY pgrst, 'reload config';");

            return NextResponse.json({ success: true, message: 'Table api_integrations fixed and schema cache reloaded' });
        } finally {
            client.release();
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
