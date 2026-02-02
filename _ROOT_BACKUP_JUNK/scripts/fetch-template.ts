
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fetchTemplate() {
    const targetId = 'fde183ad-1c20-4d6c-9efb-89d08f483cf2'
    console.log(`Fetching template ID: ${targetId}...`)

    const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .eq('id', targetId)
        .single()

    if (error) {
        console.error('Error fetching template:', error)
        return
    }

    if (!data) {
        console.error('Template not found')
        return
    }

    console.log('Template found:', data.title)

    const outputPath = path.resolve(__dirname, 'palmilha_biomecanica_original.json')
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))
    console.log(`Saved to ${outputPath}`)
}

fetchTemplate()
