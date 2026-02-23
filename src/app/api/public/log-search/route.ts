import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { cep, lat, lng } = body;

        if (!cep) return NextResponse.json({ success: false, error: "CEP obrigatório" }, { status: 400 });

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        await supabase
            .from('lead_search_history')
            .insert([{
                cep,
                latitude: lat || null,
                longitude: lng || null,
                searched_at: new Date().toISOString()
            }]);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Log Search Error:", e);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
