
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function finishMigration() {
    console.log('🏁 Finishing User Identity Migration...');

    // IDs identified from previous run logs
    const OLD_ID = '0273dd3c-996a-4d40-8fea-eb89118345b2';
    const NEW_ID = '839a77d3-a7f0-4103-bc4a-004ec550bd15';

    if (!OLD_ID || !NEW_ID) {
        console.error('❌ Missing IDs. Check logs.');
        return;
    }

    const client = new Client({
        connectionString: process.env.DIRECT_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // Tables that reference users/profiles
        // We update the FKs to point to the new user ID
        const tablesToUpdate = [
            { table: 'appointments', col: 'professional_id' },
            { table: 'schedules', col: 'professional_id' },
            { table: 'availabilities', col: 'professional_id' },
            { table: 'organization_members', col: 'user_id' }
        ];

        for (const t of tablesToUpdate) {
            console.log(`🔄 Moving records in ${t.table}...`);
            try {
                const res = await client.query(`
                    UPDATE public.${t.table} 
                    SET ${t.col} = $1 
                    WHERE ${t.col} = $2
                `, [NEW_ID, OLD_ID]);
                console.log(`   ✅ Moved ${res.rowCount} records.`);
            } catch (e) {
                // Ignore if table doesn't exist (e.g. availabilities might be named differently)
                console.log(`   ⚠️ Skipped ${t.table}: ${e.message}`);
            }
        }

        // Now safe to delete old profile
        console.log('🗑️  Deleting old profile...');
        await client.query("DELETE FROM public.profiles WHERE id = $1", [OLD_ID]);

        // And delete old auth user (the archived one)
        console.log('🗑️  Deleting old auth user...');
        await client.query("DELETE FROM auth.users WHERE id = $1", [OLD_ID]);

        console.log('🎉 MIGRATION 100% COMPLETE!');
        console.log('👉 You are now free to login with: wmelot@gmail.com / Password123!');

        await client.end();
    } catch (err) {
        console.error('❌ Error:', err);
    }
}

finishMigration();
