
import 'dotenv/config'
import pkg from 'pg';
const { Client } = pkg;
import path from 'path'
import { config } from 'dotenv'

config({ path: path.resolve(process.cwd(), '.env.local') })

async function checkPatientRecordCols() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL
    })

    try {
        await client.connect()
        const res = await client.query("SELECT * FROM public.patient_records LIMIT 1")
        if (res.rows.length > 0) {
            console.log("Columns of patient_records:", Object.keys(res.rows[0]))
        } else {
            console.log("Empty or Error, checking info schema...")
            const resCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'patient_records' AND table_schema = 'public'")
            console.table(resCols.rows)
        }
    } catch (err) {
        console.error(err)
    } finally {
        await client.end()
    }
}

checkPatientRecordCols()
