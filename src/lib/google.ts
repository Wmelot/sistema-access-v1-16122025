import { google } from 'googleapis';

export const getGoogleOAuthClient = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
        throw new Error('Missing Google OAuth environment variables');
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

/**
 * Robustly gets an authenticated Google client, handling token refresh automatically
 * and persisting the new token back to the database.
 */
export async function getFreshGoogleAuthClient(profileId: string) {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const supabase = await createAdminClient();

    const { data: integ, error } = await supabase
        .from('professional_integrations')
        .select('*')
        .eq('profile_id', profileId)
        .eq('provider', 'google_calendar')
        .single();

    if (error || !integ) {
        throw new Error(`Google Calendar integration not found for profile ${profileId}`);
    }

    const oauth2Client = getGoogleOAuthClient();
    oauth2Client.setCredentials({
        access_token: integ.access_token,
        refresh_token: integ.refresh_token,
        expiry_date: integ.expiry_date
    });

    // Check if token is expired or expires in the next 5 minutes
    const isExpired = integ.expiry_date ? (Number(integ.expiry_date) < (Date.now() + 300000)) : true;

    if (isExpired && integ.refresh_token) {
        try {
            console.log(`[GoogleAuth] Token expired for ${profileId}. Refreshing...`);
            const { credentials } = await oauth2Client.refreshAccessToken();

            // Save new tokens
            const updates: any = {
                access_token: credentials.access_token,
                expiry_date: credentials.expiry_date,
                updated_at: new Date().toISOString()
            };

            // Refresh token is occasionally rotated or returned again
            if (credentials.refresh_token) {
                updates.refresh_token = credentials.refresh_token;
            }

            await supabase
                .from('professional_integrations')
                .update(updates)
                .eq('id', integ.id);

            oauth2Client.setCredentials(credentials);
            console.log(`[GoogleAuth] Token refreshed successfully for ${profileId}`);
        } catch (refreshError) {
            console.error(`[GoogleAuth] Critical: Failed to refresh token for ${profileId}`, refreshError);
            throw refreshError;
        }
    }

    return oauth2Client;
}

export const getAuthUrl = (state?: string) => {
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
        state: state,
    });
};

export const getCalendarEvents = async (accessToken: string, refreshToken: string | null, timeMin: string, timeMax: string) => {
    const oauth2Client = getGoogleOAuthClient();
    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken || undefined, // Optional if we still have a valid access token, but safe to pass if present
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: timeMin,
            timeMax: timeMax,
            maxResults: 250, // Reasonable batch size
            singleEvents: true, // Expand recurring events
            orderBy: 'startTime',
        });
        return response.data.items || [];
    } catch (error) {
        console.error('Error fetching Google Calendar events:', error);
        // We catch here to prevent one failed sync from breaking the whole schedule
        return [];
    }
};

export const insertCalendarEvent = async (accessToken: string, refreshToken: string | null, event: any) => {
    const oauth2Client = getGoogleOAuthClient();
    oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken || undefined });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
        });
        return response.data;
    } catch (error) {
        console.error('Error inserting Google Calendar event:', error);
        return null;
    }
};

export const updateCalendarEvent = async (accessToken: string, refreshToken: string | null, eventId: string, event: any) => {
    const oauth2Client = getGoogleOAuthClient();
    oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken || undefined });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
        const response = await calendar.events.update({
            calendarId: 'primary',
            eventId: eventId,
            requestBody: event,
        });
        return response.data;
    } catch (error) {
        console.error('Error updating Google Calendar event:', error);
        return null; // Return null on failure
    }
};

export const deleteCalendarEvent = async (accessToken: string, refreshToken: string | null, eventId: string) => {
    const oauth2Client = getGoogleOAuthClient();
    oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken || undefined });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
        await calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId,
        });
        return true;
    } catch (error) {
        console.error('Error deleting Google Calendar event:', error);
        return false;
    }
};
