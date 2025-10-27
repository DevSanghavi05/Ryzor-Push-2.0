
import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuth2Client } from '@/lib/google-auth';
import { google } from 'googleapis';
import { parseCookies } from 'nookies';

export async function GET(req: NextRequest) {
  const cookies = parseCookies({ req });
  const accessToken = cookies.google_access_token;
  const refreshToken = cookies.google_refresh_token;

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: 'User not authenticated for Google Drive' }, { status: 401 });
  }

  const oauth2Client = getGoogleOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Handle token refresh if necessary
  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      // A new refresh token is not typically issued, but handle if it is
      // Here you would re-set the cookie if needed
    }
    // Update the access token cookie
    // Note: nookies doesn't work directly in this event handler,
    // so we would need a more complex setup to update cookies on refresh.
    // For now, we rely on the client re-authenticating if the refresh token also expires.
  });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    const response = await drive.files.list({
      pageSize: 20,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, webViewLink, iconLink)',
    });

    return NextResponse.json(response.data.files || []);

  } catch (error: any) {
    console.error('The API returned an error: ' + error);
    // If the error is an auth error, it might mean the token is invalid
    if (error.response?.status === 401 || error.response?.status === 403) {
        // Here you could attempt a token refresh explicitly or just signal re-auth
        return NextResponse.json({ error: 'Google Drive authentication failed. Please re-sync.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch files from Google Drive' }, { status: 500 });
  }
}
