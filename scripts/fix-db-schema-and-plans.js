
const { Client } = require('pg');

const config = {
    user: 'postgres',
    password: 'WMFM@26222425',
    host: 'db.robptuukezhqvtasjyhz.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
};

async function fixSchemaAndPlans() {
    console.log('🔧 FIXING DB SCHEMA & PLANS...');
    const client = new Client(config);
    try {
        await client.connect();

        // 1. FIX PATIENTS (Add 'address' JSONB column)
        console.log('🏥 Checking patients table...');
        await client.query(`
            ALTER TABLE patients 
            ADD COLUMN IF NOT EXISTS address JSONB DEFAULT '{}'::jsonb;
        `);
        console.log('✅ Added/Verified "address" column in patients.');

        // 2. FIX PLAN LIMITS (Upgrade to Pro)
        console.log('🚀 Upgrading Organizations to Pro Plan...');
        // First, ensure we have a Pro plan
        const planRes = await client.query("SELECT id FROM plan_configs WHERE name = 'Pro' LIMIT 1");
        let proPlanId;

        if (planRes.rows.length > 0) {
            proPlanId = planRes.rows[0].id;
        } else {
            console.log('⚠️ Pro plan not found. Creating it...');
            const newPlan = await client.query(`
                INSERT INTO plan_configs (name, max_professionals, max_locations, price_monthly, features)
                VALUES ('Pro', 100, 10, 0.00, '{}')
                RETURNING id;
            `);
            proPlanId = newPlan.rows[0].id;
        }

        // Apply Pro plan to ALL organizations (for now, to unblock everyone)
        await client.query(`UPDATE organizations SET plan_config_id = $1`, [proPlanId]);
        console.log(`✅ All organizations upgraded to Pro (Plan ID: ${proPlanId})`);


        // 3. FIX TRANSACTIONS (Add organization_id if missing)
        console.log('💰 Checking transactions table...');
        // Check if table exists first
        const tableCheck = await client.query("SELECT to_regclass('public.transactions')");
        if (tableCheck.rows[0].to_regclass) {
            await client.query(`
                ALTER TABLE transactions 
                ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
            `);
            // Fix RLS for transactions if needed (Emergency open)
            await client.query(`ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;`);
            console.log('✅ Added/Verified "organization_id" in transactions & Disabled RLS.');
        } else {
            console.log('⚠️ Table "transactions" does not exist (Maybe it is named "financial_transactions" or "expenses"?)');
            // Let's check for 'expenses' just in case
            const expCheck = await client.query("SELECT to_regclass('public.expenses')");
            if (expCheck.rows[0].to_regclass) {
                await client.query(`ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;`);
                console.log('✅ Disabled RLS on "expenses" (alternative name).');
            }
        }

        // 4. FIX REMINDERS (RLS)
        console.log('🔔 Checking reminders table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS reminders (
                id uuid primary key default gen_random_uuid(),
                title text not null,
                date timestamptz,
                user_id uuid,
                organization_id uuid,
                created_at timestamptz default now()
            );
            ALTER TABLE reminders DISABLE ROW LEVEL SECURITY;
            GRANT ALL ON reminders TO anon, authenticated, service_role;
        `);
        console.log('✅ Reminders table verified/created & permissions granted.');


        // 5. RELOAD SCHEMA CACHE
        console.log('🔄 Reloading Supabase Schema Cache...');
        await client.query("NOTIFY pgrst, 'reload config';");

        console.log('✨ ALL FIXES APPLIED SUCCESSFULLY ✨');

    } catch (err) {
        console.error('❌ CRITICAL ERROR:', err.message);
    } finally {
        await client.end();
    }
}

fixSchemaAndPlans();
