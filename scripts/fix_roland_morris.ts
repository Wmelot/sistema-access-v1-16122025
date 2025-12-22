import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixRolandMorris() {
    const { data, error } = await supabase
        .from('form_templates')
        .select('id, title, fields')
        .ilike('title', '%Roland-Morris%')

    if (error || !data) {
        console.error('Error:', error)
        return
    }

    console.log(`\n📝 Found ${data.length} Roland-Morris template(s)\n`)

    for (const template of data) {
        console.log(`\n📋 ${template.title} (ID: ${template.id})`)
        console.log(`Total fields: ${template.fields.length}`)

        const widthCounts: Record<string, number> = {}
        template.fields.forEach((f: any) => {
            const w = f.width || 'undefined'
            widthCounts[w] = (widthCounts[w] || 0) + 1
        })

        console.log('Width distribution:')
        Object.entries(widthCounts).forEach(([width, count]) => {
            console.log(`  ${width}: ${count} fields`)
        })

        // Now force all to 50
        console.log('\n🔧 Forcing all fields to 50%...')
        const updatedFields = template.fields.map((f: any) => ({
            ...f,
            width: f.type === 'section' || f.type === 'tab' ? f.width : '50'
        }))

        const { error: updateError } = await supabase
            .from('form_templates')
            .update({ fields: updatedFields })
            .eq('id', template.id)

        if (updateError) {
            console.error('❌ Error:', updateError)
        } else {
            console.log('✅ Successfully updated to two columns!')
        }
    }
}

fixRolandMorris()
