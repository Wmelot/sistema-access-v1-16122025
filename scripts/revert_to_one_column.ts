import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function revertToOneColumn() {
    console.log('↩️  Reverting questionnaires to single column (100% width)...\n')

    const questionnaires = [
        'tampa',
        'LEFS',
        'ihot',
        'womac',
        'lysholm',
        'Roland-Morris'
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

            // Revert ALL fields to 100% (except sections/tabs)
            const updatedFields = template.fields.map((field: any) => {
                if (field.type === 'section' || field.type === 'tab') {
                    return field
                }
                return { ...field, width: '100' }
            })

            const { error: updateError } = await supabase
                .from('form_templates')
                .update({ fields: updatedFields })
                .eq('id', template.id)

            if (updateError) {
                console.error(`  ❌ Error:`, updateError)
            } else {
                const count = updatedFields.filter((f: any) => f.width === '100').length
                console.log(`  ✅ Reverted ${count} fields to single column`)
            }
        }
    }

    console.log('\n✅ All questionnaires reverted to single column layout!')
}

revertToOneColumn()
