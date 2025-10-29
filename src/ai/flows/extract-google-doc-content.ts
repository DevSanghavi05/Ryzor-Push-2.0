
'use server';
/**
 * @fileOverview A flow for extracting content from Google Drive files.
 *
 * - extractGoogleDocContent - A function that handles the content extraction.
 * - ExtractGoogleDocContentInput - The input type for the function.
 * - ExtractGoogleDocContentOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { GoogleAuth } from 'google-auth-library';

// Define Zod schemas for input and output
const ExtractGoogleDocContentInputSchema = z.object({
  fileId: z.string().describe('The ID of the Google Drive file.'),
  mimeType: z.string().describe('The MIME type of the file to determine which API to use.'),
  accessToken: z.string().describe('The user\'s Google OAuth access token.'),
});
export type ExtractGoogleDocContentInput = z.infer<typeof ExtractGoogleDocContentInputSchema>;

const ExtractGoogleDocContentOutputSchema = z.object({
  content: z.string().describe('The extracted text content from the document.'),
});
export type ExtractGoogleDocContentOutput = z.infer<typeof ExtractGoogleDocContentOutputSchema>;


// The main exported function that wraps the Genkit flow
export async function extractGoogleDocContent(input: ExtractGoogleDocContentInput): Promise<ExtractGoogleDocContentOutput> {
  return extractGoogleDocContentFlow(input);
}


// Define the Genkit flow
const extractGoogleDocContentFlow = ai.defineFlow(
  {
    name: 'extractGoogleDocContentFlow',
    inputSchema: ExtractGoogleDocContentInputSchema,
    outputSchema: ExtractGoogleDocContentOutputSchema,
  },
  async (input) => {
    const { fileId, mimeType, accessToken } = input;
    let content = '';

    const auth = new GoogleAuth();
    const oauth2Client = auth.fromJSON({
      type: 'authorized_user',
      client_id: '', // Not needed for user-provided token
      client_secret: '', // Not needed
      refresh_token: '', // Not provided
    });
    oauth2Client.setCredentials({ access_token: accessToken });

    try {
      if (mimeType.includes('document')) {
        // Google Docs
        const docsResponse = await fetch(`https://docs.googleapis.com/v1/documents/${fileId}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!docsResponse.ok) throw new Error(`Google Docs API error: ${docsResponse.statusText}`);
        const doc = await docsResponse.json();
        content = doc.body.content.map((element: any) => {
          if (element.paragraph) {
            return element.paragraph.elements.map((el: any) => el.textRun?.content || '').join('');
          }
          return '';
        }).join('\n');

      } else if (mimeType.includes('spreadsheet')) {
        // Google Sheets
        const sheetsResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${fileId}?includeGridData=true`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!sheetsResponse.ok) throw new Error(`Google Sheets API error: ${sheetsResponse.statusText}`);
        const sheet = await sheetsResponse.json();
        content = sheet.sheets.map((s: any) => {
            if (!s.data) return '';
            return s.data.map((grid: any) => {
                return grid.rowData?.map((row: any) => {
                    return row.values?.map((cell: any) => cell.formattedValue || '').join('\t');
                }).join('\n');
            }).join('\n\n');
        }).join('\n\n---\n\n');
        
      } else if (mimeType.includes('presentation')) {
        // Google Slides
        const slidesResponse = await fetch(`https://slides.googleapis.com/v1/presentations/${fileId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!slidesResponse.ok) throw new Error(`Google Slides API error: ${slidesResponse.statusText}`);
        const presentation = await slidesResponse.json();
        content = presentation.slides.map((slide: any) => {
            return slide.pageElements?.map((element: any) => {
                if (element.shape?.text) {
                    return element.shape.text.textElements.map((textEl: any) => textEl.textRun?.content || '').join('');
                }
                return '';
            }).join('\n');
        }).join('\n\n---\n\n');
      } else {
        throw new Error(`Unsupported MIME type for content extraction: ${mimeType}`);
      }

      return { content: content.trim() };

    } catch (error: any) {
        console.error("Error in content extraction flow:", error);
        // Re-throw to make the error visible to the caller
        throw new Error(`Failed to extract content from file ${fileId}: ${error.message}`);
    }
  }
);
