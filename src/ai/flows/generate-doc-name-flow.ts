
'use server';
/**
 * @fileOverview A flow for generating a document name from its content.
 *
 * - generateDocumentName - A function that handles the name generation.
 * - GenerateDocumentNameInput - The input type for the function.
 * - GenerateDocumentNameOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define Zod schemas for input and output
const GenerateDocumentNameInputSchema = z.object({
  textContent: z.string().describe('The text content of the document.'),
});
export type GenerateDocumentNameInput = z.infer<typeof GenerateDocumentNameInputSchema>;

const GenerateDocumentNameOutputSchema = z.object({
  name: z.string().describe('The generated, concise name for the document.'),
});
export type GenerateDocumentNameOutput = z.infer<typeof GenerateDocumentNameOutputSchema>;


// The main exported function that wraps the Genkit flow
export async function generateDocumentName(input: GenerateDocumentNameInput): Promise<GenerateDocumentNameOutput> {
  return generateDocumentNameFlow(input);
}


const prompt = ai.definePrompt({
    name: 'generateDocNamePrompt',
    input: { schema: GenerateDocumentNameInputSchema },
    output: { schema: GenerateDocumentNameOutputSchema },
    prompt: `You are an expert at summarizing and naming documents. Analyze the following document content and generate a short, descriptive name for it. The name should be concise and accurately reflect the main topic of the document. Do not include file extensions.

    DOCUMENT CONTENT:
    ---
    {{{textContent}}}
    ---
    `,
});


// Define the Genkit flow
const generateDocumentNameFlow = ai.defineFlow(
  {
    name: 'generateDocumentNameFlow',
    inputSchema: GenerateDocumentNameInputSchema,
    outputSchema: GenerateDocumentNameOutputSchema,
  },
  async (input) => {
    // If content is very short, use it directly (or a truncated version)
    if (input.textContent.length < 100) {
        let shortName = input.textContent.split('\n')[0].trim();
        if (shortName.length > 50) {
            shortName = shortName.substring(0, 47) + '...';
        }
        return { name: shortName || "Untitled Document" };
    }
    
    const {output} = await prompt(input);
    return output!;
  }
);
