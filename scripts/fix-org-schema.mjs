
import 'dotenv/config'
import pkg from 'pg';
const { Client } = pkg;
import path from 'path'
import { config } from 'dotenv'

config({ path: path.resolve(process.cwd(), '.env.local') })

async function updateSchema() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL
    })

    try {
        await client.connect()
        console.log("Conectado ao Postgres.")

        console.log("Adicionando colunas faltantes à tabela organizations...")
        await client.query(`
      ALTER TABLE public.organizations 
      ADD COLUMN IF NOT EXISTS logo_url TEXT,
      ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#000000'
    `)

        console.log("✅ Colunas logo_url e primary_color adicionadas com sucesso.")

    } catch (err) {
        console.error("Erro ao atualizar schema:", err)
    } finally {
        await client.end()
    }
}

updateSchema()
