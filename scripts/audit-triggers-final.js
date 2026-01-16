
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

async function auditTriggers() {
    console.log('🔍 DEEP AUDIT: SYSTEM TRIGGERS...');
    const client = new Client(config);
    try {
        await client.connect();

        // Query to find triggers and their functions
        const res = await client.query(`
            SELECT 
                event_object_schema as schema,
                event_object_table as table,
                trigger_name,
                event_manipulation as event,
                action_statement as action
            FROM information_schema.triggers
            WHERE event_object_schema IN ('public', 'auth')
            ORDER BY event_object_schema, event_object_table;
        `);

        console.log(`Found ${res.rowCount} triggers.`);

        // Critical Check: on_auth_user_created
        const hasAuthTrigger = res.rows.some(r => r.table === 'users' && r.trigger_name === 'on_auth_user_created');

        if (hasAuthTrigger) {
            console.log('✅ CRITICAL: on_auth_user_created exists.');
        } else {
            console.error('❌ CRITICAL: on_auth_user_created IS MISSING on auth.users!');
        }

        // List all for log
        res.rows.forEach(r => {
            console.log(`- [${r.schema}.${r.table}] ${r.trigger_name} (${r.event})`);
        });

    } catch (err) {
        console.error('❌ ERROR:', err.message);
    } finally {
        await client.end();
    }
}

auditTriggers();
