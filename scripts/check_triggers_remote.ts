
import { Client } from 'pg'
import dns from 'dns'
import util from 'util'

const lookup = util.promisify(dns.lookup)

// Original Host
const originalHost = 'db.robptuukezhqvtasjyhz.supabase.co'
const connectionStringTemplate = 'postgresql://postgres:WMFM@26222425@<HOST>:54322/postgres'

async function checkTriggers() {
    try {
        console.log(`Looking up IP for ${originalHost}...`)
        // use dns.lookup which uses the OS resolver (like ping)
        const { address } = await lookup(originalHost, { family: 4 })
        console.log(`Resolved to: ${address}`)

        const connectionString = connectionStringTemplate.replace('<HOST>', address)

        const client = new Client({
            connectionString,
            ssl: { rejectUnauthorized: false }
        })

        await client.connect()
        console.log("Connected! Querying triggers...")

        const res = await client.query(`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_schema = 'auth'
      AND event_object_table = 'users';
    `)

        console.log("TRIGGERS FOUND:", JSON.stringify(res.rows, null, 2))
        await client.end()

    } catch (err) {
        console.error("Error:", err)
    }
}

checkTriggers()
