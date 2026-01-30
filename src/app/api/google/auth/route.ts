import { getAuthUrl, getGoogleOAuthClient } from '@/lib/google';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profile_id');
    const slug = searchParams.get('slug');

    // Combine profileId and slug into state
    const state = JSON.stringify({ profileId, slug });

    // Pass combined state
    const url = getAuthUrl(state);

    return redirect(url);
}
