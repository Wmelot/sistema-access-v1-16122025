import { getAuthUrl, getGoogleOAuthClient } from '@/lib/google';
import { redirect } from 'next/navigation';

export async function GET() {
    console.log('--- Google Auth Start ---');
    console.log('Redirect URI configured in Env:', process.env.GOOGLE_REDIRECT_URI);

    const url = getAuthUrl();
    console.log('Generated Auth URL root:', url.split('?')[0]); // Log base only for safety

    return redirect(url);
}
