
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getAuthenticatedClient } from '@/lib/google-auth-server';


export async function GET(req: NextRequest) {
  try {
    const oauth2Client = await getAuthenticatedClient(req);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const response = await drive.files.list({
      pageSize: 50,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, webViewLink, iconLink)',
      q: "mimeType='application/vnd.google-apps.document' or mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.google-apps.presentation' or mimeType='application/pdf'"
    });

    return NextResponse.json(response.data.files || []);

  } catch (error: any) {
    console.error('The API returned an error: ' + error);
    // If the error is an auth error, it might mean the token is invalid
    if (error.code === 401 || error.code === 403) {
        return NextResponse.json({ error: 'Google Drive authentication failed. Please sign in again.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch files from Google Drive' }, { status: 500 });
  }
}

    