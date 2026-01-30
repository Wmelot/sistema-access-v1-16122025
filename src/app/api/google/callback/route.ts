import { getGoogleOAuthClient } from '@/lib/google';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    // console.log('--- Google Callback Handling Started ---');
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state'); // Should contain profile_id
    let redirectUrl: string | null = null;

    if (error) {
        console.error('Callback Error Parameter:', error);
        return NextResponse.json({ error }, { status: 400 });
    }

    if (!code) {
        console.error('Callback Code Missing for URL:', request.url);
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: authError
        } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('Auth Error or No User:', authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const oauth2Client = getGoogleOAuthClient();
        const { tokens } = await oauth2Client.getToken(code);

        // Parse state (contains profileId and slug)
        let profileId = user.id;
        let slug = '';

        try {
            if (state) {
                const parsed = JSON.parse(state);
                profileId = parsed.profileId || user.id;
                slug = parsed.slug || '';
            }
        } catch (e) {
            console.error("State parse error:", e);
        }

        // Store tokens in Supabase
        const { error: dbError } = await supabase
            .from('professional_integrations' as any)
            .upsert(
                {
                    profile_id: profileId,
                    provider: 'google_calendar',
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expiry_date: tokens.expiry_date,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'profile_id, provider',
                }
            );

        if (dbError) {
            console.error('Error storing tokens in DB:', dbError);
            return NextResponse.json({ error: 'Failed to store tokens', details: dbError }, { status: 500 });
        }

        // Redirect back to professional page
        if (slug) {
            redirectUrl = `/dashboard/${slug}/settings/professionals?success=true`;
        } else {
            redirectUrl = '/dashboard?success=true';
        }
    } catch (err) {
        console.error('OAuth Exception:', err);
        return NextResponse.json({ error: 'OAuth failed', details: String(err) }, { status: 500 });
    }

    if (redirectUrl) {
        redirect(redirectUrl);
    }

    return NextResponse.json({ msg: "Success" }); // Should not reach here due to redirect
}

