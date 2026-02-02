
import { db } from '../src/lib/db';
import fs from 'fs';
import path from 'path';

async function runMigration() {
    console.log('Running Scheduling System Migration...');

    try {
        const sqlPath = path.join(process.cwd(), 'seeds', '02_scheduling_rules.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split commands by semicolon to handle multiple statements if driver doesn't support batch
        // But pg-pool usually handles string block fine.

        await db.query(sql);

        console.log('✅ Migration executed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

// Check if run directly
// In Next.js environment context might be tricky, but let's try via tsx
runMigration().then(() => process.exit(0));
