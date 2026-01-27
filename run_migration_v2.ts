import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { db } from "./src/lib/db"
import { Client } from "pg" // Use Client directly if Pool fails

async function runMigration() {
    try {
        console.log("Running migration via src/lib/db...")

        // Add columns to organizations
        await db.query(`
            ALTER TABLE organizations 
            ADD COLUMN IF NOT EXISTS footer_message TEXT,
            ADD COLUMN IF NOT EXISTS maps_url TEXT,
            ADD COLUMN IF NOT EXISTS address TEXT;
        `)
        console.log("Updated organizations table")

        // Add columns to services
        await db.query(`
            ALTER TABLE services 
            ADD COLUMN IF NOT EXISTS special_reminder TEXT;
        `)
        console.log("Updated services table")

        process.exit(0)
    } catch (err) {
        console.error("Migration failed:", err)
        process.exit(1)
    }
}

runMigration()
