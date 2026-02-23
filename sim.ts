const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPending() {
    const { data: followups } = await s.from('assessment_follow_ups').select('*').eq('status', 'pending');
    console.log("Pending follow_ups count =", followups?.length || 0);
    
    if (followups && followups.length > 0) {
        // Change one of them to now
        const target = followups[0];
        console.log("Changing specific followup to execute NOW. Patient:", target.patient_id, "Type:", target.questionnaire_type);
        
        const nowLocal = new Date().toISOString()
        const { error } = await s.from('assessment_follow_ups').update({ scheduled_date: nowLocal }).eq('id', target.id).select();
        
        if (error) console.error("Error updating:", error);
        else console.log("Updated ID:", target.id);
    }
}
checkPending()
