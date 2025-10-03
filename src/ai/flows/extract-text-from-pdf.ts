'use server';

/**
 * @fileOverview An AI agent that extracts text from a PDF file using a multimodal model.
 *
 * - extractTextFromPdf - A function that handles the PDF text extraction process.
 * - ExtractTextFromPdfInput - The input type for the extractTextFromPdf function.
 * - ExtractTextFromPdfOutput - The return type for the extractTextFromPdf function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractTextFromPdfInputSchema = z.string().describe("A PDF file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'.");
export type ExtractTextFromPdfInput = z.infer<typeof ExtractTextFromPdfInputSchema>;

const ExtractTextFromPdfOutputSchema = z.object({
  text: z.string().describe("The extracted text from the PDF."),
});
export type ExtractTextFromPdfOutput = z.infer<typeof ExtractTextFromPdfOutputSchema>;


export async function extractTextFromPdf(input: ExtractTextFromPdfInput): Promise<ExtractTextFromPdfOutput> {
  return extractTextFromPdfFlow(input);
}

const extractTextFromPdfFlow = ai.defineFlow(
  {
    name: 'extractTextFromPdfFlow',
    inputSchema: ExtractTextFromPdfInputSchema,
    outputSchema: ExtractTextFromPdfOutputSchema,
  },
  async (pdfDataUri) => {
    const model = ai.getModel('googleai/gemini-2.5-flash');

    const response = await ai.generate({
      model,
      prompt: [
        { text: 'Extract all text from this PDF document.' },
        { media: { url: pdfDataUri, contentType: 'application/pdf' } },
      ],
    });

    return { text: response.text };
  }
);
