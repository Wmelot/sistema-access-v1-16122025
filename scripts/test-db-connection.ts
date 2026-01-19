import pkg from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const { Client } = pkg

async function testConnection() {
    console.log("🔍 Testing Supabase Database Connection...\n")

    // Try DIRECT_URL first (more reliable)
    const directUrl = process.env.DIRECT_URL
    const poolerUrl = process.env.DATABASE_URL

    console.log("Available connection strings:")
    console.log("✓ DIRECT_URL:", directUrl ? "Found" : "Missing")
    console.log("✓ DATABASE_URL:", poolerUrl ? "Found" : "Missing")
    console.log()

    // Test DIRECT connection
    if (directUrl) {
        console.log("Testing DIRECT connection...")
        const client = new Client({
            connectionString: directUrl,
            ssl: { rejectUnauthorized: false }
        })

        try {
            await client.connect()
            console.log("✅ DIRECT connection successful!")

            // Test query
            const result = await client.query("SELECT current_database(), current_user, version()")
            console.log("Database:", result.rows[0].current_database)
            console.log("User:", result.rows[0].current_user)
            console.log()

            // Check if granular_permissions exists
            const tableCheck = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'granular_permissions'
                )
            `)

            if (tableCheck.rows[0].exists) {
                console.log("✅ granular_permissions table exists!")

                const count = await client.query("SELECT COUNT(*) FROM granular_permissions")
                console.log(`   Current records: ${count.rows[0].count}`)
            } else {
                console.log("⚠️  granular_permissions table does NOT exist yet")
                console.log("   Please run the CREATE TABLE SQL in Supabase Dashboard")
            }

            await client.end()
            return true

        } catch (error: any) {
            console.error("❌ DIRECT connection failed:", error.message)
            await client.end().catch(() => { })
            return false
        }
    }

    return false
}

testConnection()
