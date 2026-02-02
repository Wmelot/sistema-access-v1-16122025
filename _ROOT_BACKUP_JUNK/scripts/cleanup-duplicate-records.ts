import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

async function cleanup() {
    console.log("🧹 CLEANING UP DUPLICATE RECORDS...")

    // Find appointments with multiple records
    const { data: duplicates } = await client.rpc('find_duplicate_records', {}, { count: 'exact' })
    
    // Alternative: Manual query
    const query = `
        SELECT appointment_id, COUNT(*) as count
        FROM patient_records
        GROUP BY appointment_id
        HAVING COUNT(*) > 1
    `
    
    const { data: appts } = await client.rpc('exec_sql', { sql: query })
    
    // Simpler approach: Just query directly
    const { data: records } = await client
        .from('patient_records')
        .select('id, appointment_id, created_at, updated_at')
        .order('appointment_id')
        .order('created_at', { ascending: false })
    
    if (!records) {
        console.log("No records found")
        return
    }

    // Group by appointment_id
    const grouped = records.reduce((acc: any, r) => {
        if (!acc[r.appointment_id]) acc[r.appointment_id] = []
        acc[r.appointment_id].push(r)
        return acc
    }, {})

    let totalDeleted = 0

    for (const [apptId, recs] of Object.entries(grouped) as any) {
        if (recs.length > 1) {
            console.log(`\nAppointment ${apptId} has ${recs.length} records:`)
            
            // Keep the most recently updated one
            const sorted = recs.sort((a: any, b: any) => 
                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            )
            
            const keep = sorted[0]
            const toDelete = sorted.slice(1)
            
            console.log(`  ✅ Keeping: ${keep.id} (updated: ${keep.updated_at})`)
            
            for (const del of toDelete) {
                console.log(`  ❌ Deleting: ${del.id} (updated: ${del.updated_at})`)
                const { error } = await client
                    .from('patient_records')
                    .delete()
                    .eq('id', del.id)
                
                if (error) {
                    console.log(`     Error: ${error.message}`)
                } else {
                    totalDeleted++
                }
            }
        }
    }

    console.log(`\n✅ Cleanup complete! Deleted ${totalDeleted} duplicate records.`)
}

cleanup()
