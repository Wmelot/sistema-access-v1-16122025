
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function restoreLegacy() {
    console.log('Restoring Legacy Assessment Template...')

    // Read Original JSON from file
    // Assumes file is in same directory
    const jsonPath = path.resolve(__dirname, 'palmilha_biomecanica_original.json')
    if (!fs.existsSync(jsonPath)) {
        console.error('JSON file not found at:', jsonPath)
        process.exit(1)
    }

    const rawData = fs.readFileSync(jsonPath, 'utf-8')
    const template = JSON.parse(rawData)

    // Ensure metadata
    template.title = "Avaliação Física Avançada"
    template.description = "Versão Clássica (Restaurada)"
    // IMPORTANT: Remove ID to force new creation cleanly
    delete template.id
    delete template.created_at
    delete template.updated_at

    // Ensure fields key exists (JSON usually has it)
    if (!template.fields) {
        console.error("Template JSON missing 'fields'.")
        process.exit(1)
    }

    // Insert
    const { data, error } = await supabase
        .from('form_templates')
        .insert({
            ...template,
            // is_system: true, // Removed as column missing
            is_active: true,
            deleted_at: null
        })
        .select()
        .single()

    if (error) {
        console.error('Error inserting legacy template:', error)
        process.exit(1)
    }

    console.log('Legacy Template Restored Successfully!')
    console.log('ID:', data.id)
    console.log('Title:', data.title)

    // Optional: Update `assessment-test` page logic?
    // We will do that manually.
}

restoreLegacy().catch(console.error)
