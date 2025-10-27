
import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuth2Client } from '@/lib/google-auth';
import { google } from 'googleapis';
import { cookies } from 'next/headers';

// Helper to extract text from a Google Doc response object
const extractTextFromDoc = (doc: any): string => {
    let text = '';
    if (doc.body && doc.body.content) {
        doc.body.content.forEach((element: any) => {
            if (element.paragraph) {
                element.paragraph.elements.forEach((paragraphElement: any) => {
                    if (paragraphElement.textRun) {
                        text += paragraphElement.textRun.content;
                    }
                });
            }
        });
    }
    return text;
};


export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const fileId = params.id;
  const cookieStore = cookies();
  const accessToken = cookieStore.get('google_access_token')?.value;
  const refreshToken = cookieStore.get('google_refresh_token')?.value;

  if (!fileId) {
    return NextResponse.json({ error: 'Missing file ID' }, { status: 400 });
  }
  
  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: 'User not authenticated for Google API' }, { status: 401 });
  }

  const oauth2Client = getGoogleOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const docs = google.docs({ version: 'v1', auth: oauth2Client });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    // First, get the mime type to check if it's a Google Doc or something else
    const fileMetadata = await drive.files.get({
        fileId: fileId,
        fields: 'mimeType, name'
    });

    const mimeType = fileMetadata.data.mimeType;
    let textContent = '';

    if (mimeType === 'application/vnd.google-apps.document') {
        const doc = await docs.documents.get({
            documentId: fileId,
        });
        textContent = extractTextFromDoc(doc.data);
    } else if (mimeType === 'application/pdf' || mimeType?.startsWith('text/')) {
         const response = await drive.files.get(
            { fileId: fileId, alt: 'media' },
            { responseType: 'stream' }
        );
        // For simplicity in this example, we're not parsing PDF content on the server.
        // We'd need a library like pdf-parse for that. We'll mark it for import.
        // For now, we return an indication that it can be imported.
        // In a real scenario, you'd process the stream here.
        // Let's assume for now we just confirm we can access it.
        textContent = `Content for ${fileMetadata.data.name} is ready for analysis.`;

    } else {
         return NextResponse.json({ error: 'File type not supported for content extraction.' }, { status: 400 });
    }

    return NextResponse.json({ textContent });

  } catch (error: any) {
    console.error('API Error:', error.response?.data || error.message);
    if (error.response?.status === 401 || error.response?.status === 403) {
        return NextResponse.json({ error: 'Google API authentication failed. Please re-sync.' }, { status: 401 });
    }
    return NextResponse.json({ error: `Failed to fetch document content: ${error.message}` }, { status: 500 });
  }
}
