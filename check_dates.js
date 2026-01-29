const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAssessments() {
    const { data, error } = await supabase
        .from('patient_assessments')
        .select('id, created_at')

    if (error) {
        console.error('Error:', error)
        return
    }

    const nullDates = data.filter(a => !a.created_at)
    console.log('Assessments with NULL created_at:', nullDates.length)

    const invalidDates = data.filter(a => a.created_at && isNaN(new Date(a.created_at).getTime()))
    console.log('Assessments with INVALID created_at:', invalidDates.length)
}

checkAssessments()
