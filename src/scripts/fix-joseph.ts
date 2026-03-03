import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fix() {
    const { data: records } = await supabase.from('patient_records').select('id, content, professional_id, patients!inner(name)').ilike('patients.name', '%Joseph%').order('created_at', { ascending: false }).limit(5)
    
    console.log("Records for Joseph:", records?.map(r => ({ id: r.id, patient: r.patients?.name, prof: r.professional_id, type: r.content?._record_type })))

    if (records && records.length > 0) {
        const idToFix = records[0].id
        
        // Find Warley's prof ID
        const { data: profs } = await supabase.from('profiles').select('id, full_name').ilike('full_name', '%Warley%')
        const warleyId = profs?.[0]?.id

        if (warleyId) {
            console.log(`Fixing record ${idToFix} with prof ID ${warleyId} and setting type to assessment`)
            
            const newContent = { ...records[0].content, _record_type: 'assessment' }
            
            const { error } = await supabase.from('patient_records').update({ 
                professional_id: warleyId,
                content: newContent
            }).eq('id', idToFix)
            
            if (error) console.error("Error updating:", error)
            else console.log("Updated successfully!")
        }
    }
}
fix()
