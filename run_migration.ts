
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { Client } from "pg"

async function runMigration() {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
    console.log("Connecting to:", connectionString?.split("@")[1])

    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    })

    try {
        await client.connect()
        console.log("Connected to DB")

        // Add columns to organizations
        await client.query(`
            ALTER TABLE organizations 
            ADD COLUMN IF NOT EXISTS footer_message TEXT,
            ADD COLUMN IF NOT EXISTS maps_url TEXT,
            ADD COLUMN IF NOT EXISTS address TEXT;
        `)
        console.log("Updated organizations table")

        // Add columns to services
        await client.query(`
            ALTER TABLE services 
            ADD COLUMN IF NOT EXISTS special_reminder TEXT;
        `)
        console.log("Updated services table")

    } catch (err) {
        console.error("Migration failed:", err)
    } finally {
        await client.end()
    }
}

runMigration()
