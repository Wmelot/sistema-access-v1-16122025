import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function setTwoColumns() {
    console.log('📐 Setting questionnaires to two-column layout...\n')

    // Questionnaires to modify (case-insensitive search)
    const questionnaires = [
        'Roland-Morris',
        'tampa',
        'LEFS',
        'ihot',
        'womac',
        'lysholm'
    ]

    for (const searchTerm of questionnaires) {
        console.log(`\n🔍 Searching for: "${searchTerm}"`)

        const { data: templates, error } = await supabase
            .from('form_templates')
            .select('id, title, fields')
            .ilike('title', `%${searchTerm}%`)
            .eq('is_active', true)

        if (error) {
            console.error(`❌ Error fetching templates:`, error)
            continue
        }

        if (!templates || templates.length === 0) {
            console.log(`⚠️  No templates found matching "${searchTerm}"`)
            continue
        }

        for (const template of templates) {
            console.log(`\n📝 Processing: ${template.title}`)

            let modified = false
            const updatedFields = template.fields.map((field: any) => {
                // Skip section headers and other non-input fields
                if (field.type === 'section' || field.type === 'tab') {
                    return field
                }

                // Force all fields to 50% for two-column layout
                if (field.width !== '50') {
                    modified = true
                    return { ...field, width: '50' }
                }

                return field
            })

            if (modified) {
                const { error: updateError } = await supabase
                    .from('form_templates')
                    .update({ fields: updatedFields })
                    .eq('id', template.id)

                if (updateError) {
                    console.error(`  ❌ Error updating template:`, updateError)
                } else {
                    console.log(`  ✅ Successfully set to two columns`)
                    console.log(`  📊 Modified ${updatedFields.filter((f: any) => f.width === '50').length} fields`)
                }
            } else {
                console.log(`  ℹ️  Already using custom widths`)
            }
        }
    }

    console.log('\n✅ Layout update complete!')
}

setTwoColumns().catch(console.error)
