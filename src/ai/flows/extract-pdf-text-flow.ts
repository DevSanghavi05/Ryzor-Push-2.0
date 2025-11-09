
'use server';
/**
 * @fileOverview A server-side flow for extracting text from a PDF file using Gemini Vision.
 *
 * - extractPdfText - A function that handles the text extraction.
 * - ExtractPdfTextInput - The input type for the function.
 * - ExtractPdfTextOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define Zod schemas for input and output
const ExtractPdfTextInputSchema = z.object({
  pdfDataUri: z.string().describe("A PDF file encoded as a data URI. Expected format: 'data:application/pdf;base64,<encoded_data>'."),
});
export type ExtractPdfTextInput = z.infer<typeof ExtractPdfTextInputSchema>;

const ExtractPdfTextOutputSchema = z.object({
  text: z.string().describe('The extracted text content from the PDF.'),
});
export type ExtractPdfTextOutput = z.infer<typeof ExtractPdfTextOutputSchema>;


// The main exported function that wraps the Genkit flow
export async function extractPdfText(input: ExtractPdfTextInput): Promise<ExtractPdfTextOutput> {
  return extractPdfTextFlow(input);
}


// Define the Genkit flow
const extractPdfTextFlow = ai.defineFlow(
  {
    name: 'extractPdfTextFlow',
    inputSchema: ExtractPdfTextInputSchema,
    outputSchema: ExtractPdfTextOutputSchema,
  },
  async (input) => {
    try {
        const { text } = await ai.generate({
            model: 'googleai/gemini-pro-vision',
            prompt: [
                {
                    text: 'Extract all text from the provided document. Respond only with the raw text content.'
                },
                {
                    media: {
                        url: input.pdfDataUri,
                        contentType: 'application/pdf',
                    }
                }
            ],
            config: {
              temperature: 0, // Lower temperature for more deterministic text extraction
            }
        });

      return { text };
    } catch (error: any) {
      console.error("Error in PDF text extraction flow:", error);
      // Re-throw to make the error visible to the caller
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }
);
