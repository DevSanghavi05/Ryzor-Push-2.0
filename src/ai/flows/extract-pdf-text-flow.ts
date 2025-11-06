
'use server';
/**
 * @fileOverview A server-side flow for extracting text from a PDF file.
 *
 * - extractPdfText - A function that handles the text extraction.
 * - ExtractPdfTextInput - The input type for the function.
 * - ExtractPdfTextOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import pdf from 'pdf-parse';

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
      // 1. Convert data URI to a Buffer
      const base64Data = input.pdfDataUri.split(',')[1];
      if (!base64Data) {
        throw new Error("Invalid data URI: Missing base64 data.");
      }
      const pdfBuffer = Buffer.from(base64Data, 'base64');
      
      // 2. Use pdf-parse to extract text
      const data = await pdf(pdfBuffer);

      return { text: data.text };
    } catch (error: any) {
      console.error("Error in PDF text extraction flow:", error);
      // Re-throw to make the error visible to the caller
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }
);
