
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
    const email = 'accessfisio@gmail.com'
    const password = 'Wmelo@123'
    const client = new Client(pgConfig)

    try {
        await client.connect()
        console.log("Connected to DB.")

        // 1. Get User ID from auth.users
        const userRes = await client.query("SELECT id FROM auth.users WHERE email = $1", [email])
        if (userRes.rows.length === 0) {
            console.error("User not found in auth.users!")
            return
        }
        const userId = userRes.rows[0].id
        console.log("User ID:", userId)

        // 2. Hash and Update Password in auth.users (Using extensions schema for pgcrypto)
        await client.query("UPDATE auth.users SET encrypted_password = extensions.crypt($1, extensions.gen_salt('bf')) WHERE id = $2", [password, userId])
        console.log("Password updated successfully.")

        // 3. Find Master Role ID
        const roleRes = await client.query("SELECT id FROM public.roles WHERE LOWER(name) = 'master' LIMIT 1")
        const masterRoleId = roleRes.rows[0]?.id

        if (masterRoleId) {
            console.log("Master Role ID:", masterRoleId)
            // 4. Update Profile
            await client.query("UPDATE public.profiles SET role_id = $1, organization_id = '00000000-0000-0000-0000-000000000001' WHERE id = $2", [masterRoleId, userId])
            console.log("Profile updated to Master.")
        } else {
            console.warn("Master role ID not found in roles table.")
        }

    } catch (err) {
        console.error("Error:", err)
    } finally {
        await client.end()
    }
}

run()
