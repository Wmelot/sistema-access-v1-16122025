
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { Client } from 'pg'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const pgConfig = {
    user: 'postgres',
    password: process.env.POSTGRES_PASSWORD || '0xw8SnQc09fHn7S4',
    host: 'db.robptuukezhqvtasjyhz.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

async function run() {
    const client = new Client(pgConfig)

    try {
        await client.connect()
        console.log("Connected to DB.")

        // 1. Get Administrador Role ID
        const roleRes = await client.query("SELECT id FROM public.roles WHERE LOWER(name) = 'administrador' LIMIT 1")
        const adminRoleId = roleRes.rows[0]?.id

        // 2. Get Access Fisioterapia Org ID
        const orgRes = await client.query("SELECT id FROM public.organizations WHERE slug = 'access-fisioterapia' LIMIT 1")
        const accessOrgId = orgRes.rows[0]?.id

        if (adminRoleId && accessOrgId) {
            console.log("Admin Role ID:", adminRoleId)
            console.log("Access Org ID:", accessOrgId)

            // 3. Update wmelot profile
            const updateRes = await client.query(`
                UPDATE public.profiles 
                SET role_id = $1, organization_id = $2 
                WHERE email = 'wmelot@gmail.com'
            `, [adminRoleId, accessOrgId])

            console.log("wmelot profile updated to Administrador of Access Fisioterapia. Row count:", updateRes.rowCount)
        } else {
            console.error("Critical IDs missing. adminRoleId:", adminRoleId, "accessOrgId:", accessOrgId)
        }

    } catch (err) {
        console.error("Error:", err)
    } finally {
        await client.end()
    }
}

run()
