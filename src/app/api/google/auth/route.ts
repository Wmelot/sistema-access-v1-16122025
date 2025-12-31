import { getAuthUrl, getGoogleOAuthClient } from '@/lib/google';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {


    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profile_id');

    // Pass profile_id as state if present
    const url = getAuthUrl(profileId || undefined);


    return redirect(url);
}
