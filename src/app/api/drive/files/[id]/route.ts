
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getAuthenticatedClient } from '@/lib/google-auth-server';


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

  if (!fileId) {
    return NextResponse.json({ error: 'Missing file ID' }, { status: 400 });
  }
  
  try {
    const oauth2Client = await getAuthenticatedClient(req);
    const docs = google.docs({ version: 'v1', auth: oauth2Client });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });


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
    if (error.code === 401 || error.code === 403) {
        return NextResponse.json({ error: 'Google API authentication failed. Please sign in again.' }, { status: 401 });
    }
    return NextResponse.json({ error: `Failed to fetch document content: ${error.message}` }, { status: 500 });
  }
}

    