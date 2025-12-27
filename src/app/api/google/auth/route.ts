import { getAuthUrl, getGoogleOAuthClient } from '@/lib/google';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    // console.log('--- Google Auth Start ---');
    // console.log('Redirect URI configured in Env:', process.env.GOOGLE_REDIRECT_URI);

    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profile_id');

    // Pass profile_id as state if present
    const url = getAuthUrl(profileId || undefined);
    // console.log('Generated Auth URL root:', url.split('?')[0]); // Log base only for safety

    return redirect(url);
}
