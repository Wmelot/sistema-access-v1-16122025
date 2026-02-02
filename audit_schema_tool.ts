
import { db } from "@/lib/db"

async function checkSchema() {
    console.log("--- SCHEMA REPORT ---");

    // 1. Get Columns for key tables
    const tables = ['patients', 'appointments', 'profiles', 'transactions', 'invoices', 'patient_records', 'patient_assessments', 'organizations', 'financial_commissions'];

    for (const table of tables) {
        console.log(`\nTABLE: ${table}`);
        const { rows } = await db.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = $1 AND table_schema = 'public'
            ORDER BY column_name;
        `, [table]);

        if (rows.length === 0) {
            console.log("  (Table not found in public schema)");
        } else {
            rows.forEach(r => {
                console.log(`  - ${r.column_name} (${r.data_type}, ${r.is_nullable === 'YES' ? 'null' : 'not null'})`);
            });
        }
    }

    // 2. Get Constraints (specifically Check Constraints for status enum-like fields)
    console.log("\n--- CONSTRAINTS ---");
    const { rows: constraints } = await db.query(`
        SELECT tc.table_name, cc.check_clause
        FROM information_schema.table_constraints tc
        JOIN information_schema.check_constraints cc 
        ON tc.constraint_name = cc.constraint_name
        WHERE tc.table_schema = 'public'
        AND tc.constraint_type = 'CHECK';
    `);

    constraints.forEach(c => {
        console.log(`  ${c.table_name}: ${c.check_clause}`);
    });
}

checkSchema().catch(console.error);
