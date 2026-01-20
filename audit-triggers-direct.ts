
import { Pool } from 'pg'

const connectionString = "postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres"

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
})

async function listTriggers() {
    console.log('🔍 Inspecting Triggers on users and profiles...')

    try {
        const query = `
      SELECT 
        event_object_schema as schema,
        event_object_table as table,
        trigger_name,
        action_statement,
        action_timing,
        event_manipulation
      FROM information_schema.triggers
      WHERE event_object_table IN ('users', 'profiles');
    `
        // Note: 'users' is in 'auth' schema usually, but information_schema sees all. 
        // We might need to filter by schema 'auth' or 'public'.

        const res = await pool.query(query)
        console.table(res.rows)

        console.log('\n🔍 Inspecting Function Definitions (looking for hardcoded IDs)...')
        // Get definition of functions called by triggers
        for (const row of res.rows) {
            // Extract function name usually in "EXECUTE FUNCTION func_name()"
            const funcMatch = row.action_statement.match(/EXECUTE (?:PROCEDURE|FUNCTION) ([\w\.]+)\(/i)
            if (funcMatch && funcMatch[1]) {
                const funcName = funcMatch[1] // might include schema like public.handle_new_user
                console.log(`\n📜 Function: ${funcName}`)

                // Need to clean schema if present for regproc
                const cleanFuncName = funcName.includes('.') ? funcName : `public.${funcName}`

                try {
                    const funcDef = await pool.query(`SELECT pg_get_functiondef('${cleanFuncName}'::regproc)`)
                    console.log(funcDef.rows[0].pg_get_functiondef)
                } catch (err) {
                    console.log('   (Could not get definition - might be system function or permission issue)')
                }
            }
        }

    } catch (e) {
        console.error('Error fetching triggers:', e)
    } finally {
        await pool.end()
    }
}

listTriggers()
