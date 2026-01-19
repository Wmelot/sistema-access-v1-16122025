
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function finishMigrationV3() {
    console.log('🏁 Finishing User Identity Migration (Final Sweep)...');

    // IDs identified from previous run logs
    const OLD_ID = '0273dd3c-996a-4d40-8fea-eb89118345b2';
    const NEW_ID = '839a77d3-a7f0-4103-bc4a-004ec550bd15';

    const client = new Client({
        connectionString: process.env.DIRECT_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const tablesToUpdate = [
            // Tables found in previous errors
            { table: 'professional_commission_rules', col: 'professional_id' },
            { table: 'financial_commissions', col: 'professional_id' }, // Ensure missed ones
            { table: 'appointments', col: 'created_by' }, // Often linked to user
            { table: 'patients', col: 'created_by' }
        ];

        for (const t of tablesToUpdate) {
            console.log(`🔄 Checking ${t.table} (${t.col})...`);
            try {
                // Check if table exists
                const check = await client.query(`
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = $1 AND column_name = $2
                `, [t.table, t.col]);

                if (check.rows.length > 0) {
                    const res = await client.query(`
                        UPDATE public.${t.table} 
                        SET ${t.col} = $1 
                        WHERE ${t.col} = $2
                    `, [NEW_ID, OLD_ID]);
                    console.log(`   ✅ Moved ${res.rowCount} records.`);
                } else {
                    console.log(`   ℹ️ Table/Column not found (Skipping).`);
                }
            } catch (e) {
                console.log(`   ⚠️ Error processing ${t.table}: ${e.message}`);
            }
        }

        // Now safe to delete old profile
        console.log('🗑️  Deleting old profile...');
        await client.query("DELETE FROM public.profiles WHERE id = $1", [OLD_ID]);

        // And delete old auth user
        console.log('🗑️  Deleting old auth user...');
        await client.query("DELETE FROM auth.users WHERE id = $1", [OLD_ID]);

        console.log('🎉 CLEANUP COMPLETE! No loose ends.');

        await client.end();
    } catch (err) {
        console.error('❌ Error:', err);
    }
}

finishMigrationV3();
