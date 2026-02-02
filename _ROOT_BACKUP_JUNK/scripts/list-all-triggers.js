
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

async function listTriggers() {
    console.log('Connecting to DB to list ALL triggers...');
    const client = new Client(config);
    try {
        await client.connect();

        const res = await client.query(`
            SELECT 
                event_object_schema as schema,
                event_object_table as table,
                trigger_name,
                event_manipulation as event,
                action_statement as action
            FROM information_schema.triggers
            ORDER BY event_object_schema, event_object_table;
        `);

        if (res.rowCount === 0) {
            console.log('No triggers found in the entire database.');
        } else {
            console.log('--- Found Triggers ---');
            res.rows.forEach(t => {
                console.log(`[${t.schema}.${t.table}] ${t.trigger_name} (${t.event})`);
            });
        }

    } catch (err) {
        console.error('❌ Error listing triggers:', err.message);
    } finally {
        await client.end();
    }
}

listTriggers();
