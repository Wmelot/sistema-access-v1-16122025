const fs = require('fs')
const path = require('path')

try {
    const envConfig = fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8')
    envConfig.split('\n').forEach(line => {
        const parts = line.split('=')
        if (parts.length > 1) {
            const key = parts[0].trim()
            const value = parts.slice(1).join('=').trim().replace(/^"|"$/g, '')
            if (key) process.env[key] = value
        }
    })
} catch (e) {
    console.log('No .env.local found or error reading it')
}

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars (Url or Key)')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTemplates() {
    const { data, error } = await supabase
        .from('form_templates')
        .select('id, title')
        .ilike('title', '%Física Avançada%')

    if (error) {
        console.error(error)
        return
    }

    console.log('Templates found:', data)

    if (data.length === 0) {
        console.log('Creating System Template...')
        const { data: newT, error: newE } = await supabase
            .from('form_templates')
            .insert({
                title: 'Avaliação Física Avançada',
                type: 'assessment',
                description: 'Template de Sistema para Avaliação Física com Z-Score, Radar e IA.',
                is_active: true,
                fields: [] // Empty fields as it uses custom React component
            })
            .select()
            .single()

        if (newE) console.error(newE)
        else console.log('Created:', newT)
    }
}

checkTemplates()
