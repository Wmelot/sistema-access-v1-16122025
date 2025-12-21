const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('Checking for form_metrics table...');
        const res = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'form_metrics'
            );
        `);

        const exists = res.rows[0].exists;
        console.log(`Table exists: ${exists}`);

        if (!exists) {
            console.log('Creating tables...');
            await client.query(`
                CREATE TABLE IF NOT EXISTS form_metrics (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    title TEXT NOT NULL,
                    description TEXT,
                    target_min DECIMAL DEFAULT 0,
                    target_max DECIMAL DEFAULT 10,
                    calculation_rule JSONB NOT NULL DEFAULT '{}',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS chart_templates (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    title TEXT NOT NULL,
                    type TEXT DEFAULT 'radar',
                    config JSONB NOT NULL DEFAULT '{}',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );

                -- RLS
                ALTER TABLE form_metrics ENABLE ROW LEVEL SECURITY;
                ALTER TABLE chart_templates ENABLE ROW LEVEL SECURITY;

                -- Grant permissions
                GRANT ALL ON form_metrics TO authenticated;
                GRANT ALL ON chart_templates TO authenticated;
                GRANT ALL ON form_metrics TO service_role;
                GRANT ALL ON chart_templates TO service_role;
                
                -- Policies (Simplified for immediate fix)
                DO $$ BEGIN
                    CREATE POLICY "Enable all for authenticated" ON form_metrics FOR ALL TO authenticated USING (true) WITH CHECK (true);
                EXCEPTION WHEN duplicate_object THEN NULL; END $$;
                
                DO $$ BEGIN
                    CREATE POLICY "Enable all for authenticated" ON chart_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
                EXCEPTION WHEN duplicate_object THEN NULL; END $$;
            `);
            console.log('Tables created.');
        }

        console.log('Forcing PostgREST schema cache reload...');
        await client.query("NOTIFY pgrst, 'reload config'");

        // Also try the Supabase specific function if available
        try {
            await client.query("SELECT pg_reload_conf()");
        } catch (e) {
            // ignore
        }

        console.log('Done!');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

run();
