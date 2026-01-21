
import 'dotenv/config'
import pkg from 'pg';
const { Client } = pkg;
import path from 'path'
import { config } from 'dotenv'

config({ path: path.resolve(process.cwd(), '.env.local') })

async function checkOrgTable() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL
    })

    try {
        await client.connect()
        console.log("Conectado ao Postgres.")

        const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'organizations' AND table_schema = 'public'")
        console.log("Colunas na tabela organizations:")
        console.table(res.rows)

    } catch (err) {
        console.error("Erro SQL:", err)
    } finally {
        await client.end()
    }
}

checkOrgTable()
