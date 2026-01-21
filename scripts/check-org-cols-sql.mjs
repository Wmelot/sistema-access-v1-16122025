
import 'dotenv/config'
import pkg from 'pg';
const { Client } = pkg;
import path from 'path'
import { config } from 'dotenv'

config({ path: path.resolve(process.cwd(), '.env.local') })

async function checkColsRaw() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    })

    try {
        await client.connect()
        const res = await client.query("SELECT * FROM public.organizations LIMIT 1")
        if (res.rows.length > 0) {
            console.log("Columns:", Object.keys(res.rows[0]))
        } else {
            console.log("Empty table, checking schema...")
            const resCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'organizations' AND table_schema = 'public'")
            console.table(resCols.rows)
        }
    } catch (err) {
        console.error(err)
    } finally {
        await client.end()
    }
}

checkColsRaw()
