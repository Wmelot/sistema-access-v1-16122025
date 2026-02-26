import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
    request: Request,
    { params }: { params: { slug: string } }
) {
    try {
        const slug = params.slug;
        const supabase = createAdminClient();

        // Search for the syllabus in all profiles' dashboard_settings
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('dashboard_settings')
            .not('dashboard_settings', 'is', null);

        if (error) throw error;

        let allMatches: any[] = [];
        for (const profile of profiles) {
            const drafts = profile.dashboard_settings?.syllabus_drafts || [];
            const matches = drafts.filter((d: any) => d.data?.publicSlug === slug);
            allMatches = [...allMatches, ...matches];
        }

        // Sort by date descending
        allMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (allMatches.length === 0) {
            return NextResponse.json({ error: "Cronograma não encontrado" }, { status: 404 });
        }

        return NextResponse.json({ syllabus: allMatches[0].data });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
