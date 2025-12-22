import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAndFixWidths() {
    console.log('🔍 Checking questionnaire widths...\n')

    const questionnaires = [
        'tampa',
        'LEFS',
        'ihot',
        'womac',
        'lysholm',
        'Roland-Morris'
    ]

    for (const searchTerm of questionnaires) {
        const { data: templates, error } = await supabase
            .from('form_templates')
            .select('id, title, fields')
            .ilike('title', `%${searchTerm}%`)
            .eq('is_active', true)

        if (error || !templates || templates.length === 0) continue

        for (const template of templates) {
            console.log(`\n📝 ${template.title}`)

            // Check current widths
            const widths = new Set(template.fields.map((f: any) => f.width))
            console.log(`  Current widths: ${Array.from(widths).join(', ')}`)

            // Force to 100
            const updatedFields = template.fields.map((f: any) => ({
                ...f,
                width: f.type === 'section' || f.type === 'tab' ? f.width : '100'
            }))

            const { error: updateError } = await supabase
                .from('form_templates')
                .update({ fields: updatedFields })
                .eq('id', template.id)

            if (updateError) {
                console.error(`  ❌ Error:`, updateError)
            } else {
                console.log(`  ✅ All fields set to 100%`)
            }
        }
    }

    console.log('\n✅ Done!')
}

checkAndFixWidths()
