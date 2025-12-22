import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function revertAssessments() {
    console.log('🔄 Reverting assessment options to simple strings...\n')

    // Assessment titles to revert
    const assessmentTitles = [
        'Inventário de Depressão de Beck (BDI)',
        'Inventário de Ansiedade de Beck (BAI)',
        'Escala de Dor (EVA)',
        'Questionário de Qualidade de Vida (SF-36)'
    ]

    for (const title of assessmentTitles) {
        const { data: templates, error } = await supabase
            .from('form_templates')
            .select('id, title, fields')
            .eq('title', title)
            .eq('is_active', true)

        if (error) {
            console.error(`❌ Error fetching ${title}:`, error)
            continue
        }

        if (!templates || templates.length === 0) {
            console.log(`⚠️  Template not found: ${title}`)
            continue
        }

        for (const template of templates) {
            console.log(`\n📝 Processing: ${template.title}`)

            let modified = false
            const updatedFields = template.fields.map((field: any) => {
                if (!field.options || !Array.isArray(field.options)) {
                    return field
                }

                // Check if options are objects with {label, value}
                const hasObjectOptions = field.options.some((opt: any) =>
                    typeof opt === 'object' && opt !== null && 'label' in opt && 'value' in opt
                )

                if (hasObjectOptions) {
                    // Convert back to simple strings (use value for scoring)
                    const simpleOptions = field.options.map((opt: any) => {
                        if (typeof opt === 'object' && opt !== null && 'value' in opt) {
                            return String(opt.value)
                        }
                        return opt
                    })

                    modified = true
                    console.log(`  ✓ Reverted field: ${field.label || field.id}`)
                    console.log(`    Before: ${JSON.stringify(field.options.slice(0, 2))}`)
                    console.log(`    After:  ${JSON.stringify(simpleOptions.slice(0, 2))}`)

                    return { ...field, options: simpleOptions }
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
                    console.log(`  ✅ Successfully reverted template`)
                }
            } else {
                console.log(`  ℹ️  No changes needed (already using simple strings)`)
            }
        }
    }

    console.log('\n✅ Reversion complete!')
}

revertAssessments().catch(console.error)
