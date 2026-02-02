
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanupTemplates() {
    const title = "Consulta Palmilha 2.0"
    console.log(`Searching for duplicates of "${title}"...`)

    const { data: templates, error } = await supabase
        .from('form_templates')
        .select('id, title, created_at, is_active')
        .eq('title', title)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching templates:", error)
        return
    }

    if (!templates || templates.length === 0) {
        console.log("No templates found.")
        return
    }

    console.log(`Found ${templates.length} templates.`)

    // Keep the first one (latest), deactivate others
    const [latest, ...others] = templates

    if (latest && !latest.is_active) {
        console.log(`Activating latest template: ${latest.id}`)
        await supabase
            .from('form_templates')
            .update({ is_active: true })
            .eq('id', latest.id)
    }

    if (others.length > 0) {
        console.log(`Deactivating ${others.length} old templates...`)
        const ids = others.map(t => t.id)
        const { error: updateError } = await supabase
            .from('form_templates')
            .update({ is_active: false })
            .in('id', ids)

        if (updateError) {
            console.error("Error deactivating:", updateError)
        } else {
            console.log("Successfully cleaned up duplicates.")
        }
    } else {
        console.log("No duplicates to deactivate.")
    }
}

cleanupTemplates()
