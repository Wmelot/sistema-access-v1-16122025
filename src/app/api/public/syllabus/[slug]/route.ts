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
        // This is a bit heavy but works for a prototype without a dedicated table
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('dashboard_settings')
            .not('dashboard_settings', 'is', null);

        if (error) throw error;

        let foundSyllabus = null;
        for (const profile of profiles) {
            const drafts = profile.dashboard_settings?.syllabus_drafts || [];
            foundSyllabus = drafts.find((d: any) => d.data.publicSlug === slug);
            if (foundSyllabus) break;
        }

        if (!foundSyllabus) {
            return NextResponse.json({ error: "Cronograma não encontrado" }, { status: 404 });
        }

        return NextResponse.json({ syllabus: foundSyllabus.data });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
