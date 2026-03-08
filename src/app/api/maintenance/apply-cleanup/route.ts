
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const migrationPath = path.join(process.cwd(), 'supabase/migrations/20270206000000_cleanup_and_fix_fees.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        // Execute in sections to avoid transaction issues if any
        // But the script has its own BEGIN/COMMIT for cleanup.
        await db.query(sql);

        return NextResponse.json({
            success: true,
            message: "Cleanup and Fees Fix applied successfully!"
        });
    } catch (e: any) {
        console.error("Migration Error:", e);
        return NextResponse.json({
            success: false,
            error: e.message
        }, { status: 500 });
    }
}
