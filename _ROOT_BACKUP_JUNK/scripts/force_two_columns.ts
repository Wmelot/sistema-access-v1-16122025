import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function forceAllToTwoColumns() {
    console.log('📐 Forcing ALL questionnaires to two-column layout...\n')

    const questionnaires = [
        'tampa',
        'LEFS',
        'ihot',
        'womac',
        'lysholm'
    ]

    for (const searchTerm of questionnaires) {
        console.log(`\n🔍 Processing: "${searchTerm}"`)

        const { data: templates, error } = await supabase
            .from('form_templates')
            .select('id, title, fields')
            .ilike('title', `%${searchTerm}%`)
            .eq('is_active', true)

        if (error) {
            console.error(`❌ Error:`, error)
            continue
        }

        if (!templates || templates.length === 0) {
            console.log(`⚠️  No templates found`)
            continue
        }

        for (const template of templates) {
            console.log(`\n📝 ${template.title}`)

            // Force ALL fields to 50% (except sections/tabs)
            const updatedFields = template.fields.map((field: any) => {
                if (field.type === 'section' || field.type === 'tab') {
                    return field
                }
                return { ...field, width: '50' }
            })

            const { error: updateError } = await supabase
                .from('form_templates')
                .update({ fields: updatedFields })
                .eq('id', template.id)

            if (updateError) {
                console.error(`  ❌ Error:`, updateError)
            } else {
                const count = updatedFields.filter((f: any) => f.width === '50').length
                console.log(`  ✅ Converted ${count} fields to two columns`)
            }
        }
    }

    console.log('\n✅ All questionnaires updated to two-column layout!')
}

forceAllToTwoColumns()
