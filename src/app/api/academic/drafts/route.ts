import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('dashboard_settings')
            .eq('id', user.id)
            .maybeSingle();

        if (profileError) throw profileError;

        const drafts = profile?.dashboard_settings?.syllabus_drafts || [];
        return NextResponse.json({ drafts });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { drafts } = await request.json();
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Fetch current settings to preserve other keys
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('dashboard_settings')
            .eq('id', user.id)
            .maybeSingle();

        if (profileError) throw profileError;

        const currentSettings = profile?.dashboard_settings || {};
        const newSettings = { ...currentSettings, syllabus_drafts: drafts };

        const { error } = await supabase
            .from('profiles')
            .update({ dashboard_settings: newSettings })
            .eq('id', user.id);

        if (error) throw error;
        return NextResponse.json({ success: true });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
