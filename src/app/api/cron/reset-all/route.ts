
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
        .from('assessment_follow_ups')
        .update({
            status: 'pending',
            scheduled_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .neq('status', 'completed')
        .select('id')

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
        success: true,
        message: 'Status resetado para todos os pendentes no banco real.',
        count: data?.length || 0
    })
}
