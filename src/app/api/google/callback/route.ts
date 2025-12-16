import { getGoogleOAuthClient } from '@/lib/google';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    console.log('--- Google Callback Handling Started ---');
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
        console.log('Creating Supabase Client...');
        const supabase = await createClient();

        console.log('Fetching User...');
        const {
            data: { user },
            error: authError
        } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('Auth Error or No User:', authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.log('User found:', user.id);

        console.log('Getting Google OAuth Client...');
        const oauth2Client = getGoogleOAuthClient();

        console.log('Exchanging code for tokens...');
        const { tokens } = await oauth2Client.getToken(code);
        console.log('Tokens received.');

        // Determine target profile ID: usage of "state" passed from auth flow (preferred) or current auth user
        const targetProfileId = state || user.id;

        // Store tokens in Supabase
        console.log(`Storing tokens in DB for Profile ID: ${targetProfileId}...`);
        const { error: dbError } = await supabase
            .from('professional_integrations')
            .upsert(
                {
                    profile_id: targetProfileId,
                    provider: 'google_calendar',
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token, // Only returned on first auth or if prompt is forced
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

        console.log('Tokens stored successfully. Redirecting...');

        if (state) {
            // If state (profile_id) was passed, set redirect URL
            redirectUrl = `/dashboard/professionals/${state}?tab=integrations&success=true`;
        } else {
            redirectUrl = '/dashboard/integrations?success=true';
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

