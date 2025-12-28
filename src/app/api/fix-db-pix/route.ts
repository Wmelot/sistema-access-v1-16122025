import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use Service Role to bypass RLS and perform DDL if possible (though DDL usually requires direct SQL connection or dashboard)
// Since we can't do DDL via PostgREST easily without an RPC, we will try to use the `postgres` package connection from `src/app/dashboard/settings/actions.ts` logic
// actually, let's just use the pool approach which we know works for direct queries in actions.ts

import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            await client.query('ALTER TABLE public.clinic_settings ADD COLUMN IF NOT EXISTS pix_key text;');
            return NextResponse.json({ success: true, message: 'Column pix_key added successfully' });
        } finally {
            client.release();
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
