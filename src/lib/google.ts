import { google } from 'googleapis';

export const getGoogleOAuthClient = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI; // Make sure this matches your setting in Google Cloud

    if (!clientId || !clientSecret || !redirectUri) {
        throw new Error('Missing Google OAuth environment variables');
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

export const getAuthUrl = () => {
    const oauth2Client = getGoogleOAuthClient();

    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline', // Crucial for receiving a refresh token
        scope: scopes,
        include_granted_scopes: true,
        prompt: 'consent', // Force consent prompt to ensure we get a refresh token
    });
};
