
import { Client } from 'pg'
import dns from 'dns'
import util from 'util'

const lookup = util.promisify(dns.lookup)

// Original Host
const originalHost = 'db.robptuukezhqvtasjyhz.supabase.co'
const connectionStringTemplate = 'postgresql://postgres:WMFM@26222425@<HOST>:54322/postgres'

async function checkUser() {
    try {
        const { address } = await lookup(originalHost, { family: 4 })
        const connectionString = connectionStringTemplate.replace('<HOST>', address)

        const client = new Client({
            connectionString,
            ssl: { rejectUnauthorized: false }
        })

        await client.connect()
        console.log("Connected to DB...")

        const targetEmail = 'accessfisio@gmail.com'

        // Check Auth User
        const resAuth = await client.query(`SELECT id, email FROM auth.users WHERE email = $1`, [targetEmail])
        if (resAuth.rows.length === 0) {
            console.log("User NOT FOUND in auth.users")
            await client.end()
            return
        }
        const userId = resAuth.rows[0].id
        console.log(`User ID: ${userId}`)

        // Check Profile
        const resProfile = await client.query(`
        SELECT id, organization_id, role, full_name 
        FROM public.profiles 
        WHERE id = $1
    `, [userId])

        console.log("Profile Data:", resProfile.rows[0])

        const masterOrg = '00000000-0000-0000-0000-000000000001'
        if (resProfile.rows[0]?.organization_id === masterOrg) {
            console.log("SUCCESS: User is in Master Org.")
        } else {
            console.log("FAIL: User is NOT in Master Org.")
        }

        await client.end()

    } catch (err) {
        console.error("Error:", err)
    }
}

checkUser()
