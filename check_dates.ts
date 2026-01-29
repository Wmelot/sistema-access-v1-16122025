import { createAdminClient } from './src/lib/supabase/server'

async function checkAssessments() {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
        .from('patient_assessments')
        .select('id, created_at, patient_id')
        .is('created_at', null)

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Assessments with NULL created_at:', data?.length)
    if (data && data.length > 0) {
        console.log('Sample IDs:', data.slice(0, 5).map(a => a.id))
    }

    // Also check for invalid date strings if any
    const { data: allData } = await supabase.from('patient_assessments').select('id, created_at').limit(100)
    const invalid = allData?.filter(a => isNaN(new Date(a.created_at).getTime()))
    console.log('Assessments with INVALID created_at:', invalid?.length)
}

checkAssessments()
