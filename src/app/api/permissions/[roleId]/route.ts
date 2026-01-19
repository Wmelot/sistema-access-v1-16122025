import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ roleId: string }> }
) {
    const { roleId } = await params
    const supabase = await createClient()

    try {
        const { data: permissions, error } = await supabase
            .from('granular_permissions' as any)
            .select('*')
            .eq('role_id', roleId)

        if (error) throw error

        return NextResponse.json({ permissions })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ roleId: string }> }
) {
    const { roleId } = await params
    const supabase = await createClient()

    try {
        const body = await request.json()
        const { module, action, granted } = body

        // Upsert permission
        const { error } = await supabase
            .from('granular_permissions' as any)
            .upsert({
                role_id: roleId,
                module,
                action,
                granted,
                updated_at: new Date().toISOString()
            } as any, {
                onConflict: 'role_id,module,action'
            })

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
