
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function inspectTriggerFunction() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // 1. Get the function name for the trigger
        const triggerRes = await client.query(`
            SELECT trigger_name, action_statement
            FROM information_schema.triggers 
            WHERE event_object_schema = 'auth' 
            AND event_object_table = 'users'
            AND trigger_name = 'on_auth_user_created'
        `);

        if (triggerRes.rows.length === 0) {
            console.log('Trigger not found.');
            await client.end();
            return;
        }

        const action = triggerRes.rows[0].action_statement;
        console.log('Trigger executes:', action);

        // Extract function name, e.g., "EXECUTE FUNCTION public.handle_new_user()"
        const match = action.match(/EXECUTE FUNCTION ([\w\.]+)\(\)/);
        if (match) {
            const funcName = match[1];
            console.log(`Inspecting function: ${funcName}`);

            // 2. Get function definition
            const funcRes = await client.query(`
                SELECT pg_get_functiondef(oid) as def
                FROM pg_proc
                WHERE proname = $1
            `, [funcName.split('.').pop()]); // simplistic split

            if (funcRes.rows.length > 0) {
                console.log('--- Function Definition ---');
                console.log(funcRes.rows[0].def);
                console.log('---------------------------');
            } else {
                console.log('Function definition not found in pg_proc.');
            }
        }

        await client.end();
    } catch (err) {
        console.error('Error:', err);
    }
}

inspectTriggerFunction();
