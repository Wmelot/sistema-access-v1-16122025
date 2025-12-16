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
