
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function restoreTemplate() {
    // Restore the one deleted most recently: 086191ec-c837-4899-b7a2-e7f03772b53a (deleted at 23:05:52)
    // Actually, I'll pick the one with ID 086191ec-c837-4899-b7a2-e7f03772b53a as it seems valid. 
    // Wait, let's verify which one has fields. The output said "fields: {}" for all? 
    // That's suspicious. If fields is empty, the form is empty.

    // Let me check if there is one with fields.
    const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .ilike('title', '%Avaliação Física Avançada%')
        .order('created_at', { ascending: false })

    if (error) { console.error(error); return; }

    // Find first with fields
    const valid = data.find(t => t.fields && (Array.isArray(t.fields) ? t.fields.length > 0 : Object.keys(t.fields).length > 0));

    if (valid) {
        console.log(`Restoring template: [${valid.id}] ${valid.title} (Fields: ${Array.isArray(valid.fields) ? valid.fields.length : 'Object'})`)
        await supabase
            .from('form_templates')
            .update({ deleted_at: null, is_active: true })
            .eq('id', valid.id)
        console.log("Restored.")
    } else {
        console.log("No valid template found with fields. Restoring the latest one anyway to check.")
        const latest = data[0]
        if (latest) {
            await supabase
                .from('form_templates')
                .update({ deleted_at: null, is_active: true })
                .eq('id', latest.id)
            console.log(`Restored [${latest.id}] despite empty fields.`)
        }
    }
}

restoreTemplate()
