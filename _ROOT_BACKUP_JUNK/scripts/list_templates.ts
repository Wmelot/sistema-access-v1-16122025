import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function listQuestionnaires() {
    const { data, error } = await supabase
        .from('form_templates')
        .select('id, title')
        .eq('is_active', true)
        .order('title')

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('\n📋 Available Questionnaires:\n')
    data?.forEach((t, i) => {
        console.log(`${i + 1}. ${t.title}`)
    })
    console.log(`\nTotal: ${data?.length} templates\n`)
}

listQuestionnaires()
