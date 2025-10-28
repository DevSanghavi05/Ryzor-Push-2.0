
import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuth2Client } from '@/lib/google-auth';
import { google } from 'googleapis';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const accessToken = cookies().get('google_access_token')?.value;
  const refreshToken = cookies().get('google_refresh_token')?.value;

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: 'User not authenticated for Google Drive' }, { status: 401 });
  }

  const oauth2Client = getGoogleOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Handle token refresh if necessary - google-auth-library handles this automatically
  // when making an API request.

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    const response = await drive.files.list({
      pageSize: 50,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, webViewLink, iconLink)',
      q: "mimeType='application/vnd.google-apps.document' or mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.google-apps.presentation' or mimeType='application/pdf'"
    });

    return NextResponse.json(response.data.files || []);

  } catch (error: any) {
    console.error('The API returned an error: ' + error);
    // If the error is an auth error, it might mean the token is invalid
    if (error.response?.status === 401 || error.response?.status === 403) {
        return NextResponse.json({ error: 'Google Drive authentication failed. Please re-sync.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch files from Google Drive' }, { status: 500 });
  }
}
