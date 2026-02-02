
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTemplate() {
    const template = {
        title: 'Palmilha Biomecânica 2.0',
        type: 'assessment',
        description: 'Nova versão com Inteligência Artificial, Radar Chart e Análise de Tênis.',
        fields: [], // Content managed by Hardcoded Component
        is_active: true,
    }

    const { data, error } = await supabase
        .from('form_templates')
        .insert(template)
        .select()

    if (error) {
        console.error('Error creating template:', error)
    } else {
        console.log('Success! Created template:', data[0].title)
        console.log('ID:', data[0].id)
    }
}

createTemplate()
