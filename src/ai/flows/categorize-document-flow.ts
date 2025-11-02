
'use server';
/**
 * @fileOverview A flow for categorizing a document into a folder.
 *
 * - categorizeDocument - A function that handles the categorization.
 * - CategorizeDocumentInput - The input type for the function.
 * - CategorizeDocumentOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define Zod schemas for input and output
const CategorizeDocumentInputSchema = z.object({
  textContent: z.string().describe('The text content of the document.'),
});
export type CategorizeDocumentInput = z.infer<typeof CategorizeDocumentInputSchema>;

const CategorizeDocumentOutputSchema = z.object({
  category: z.string().describe('The single, most relevant folder name for the document (e.g., "Financial Reports", "Marketing", "Legal").'),
});
export type CategorizeDocumentOutput = z.infer<typeof CategorizeDocumentOutputSchema>;


// The main exported function that wraps the Genkit flow
export async function categorizeDocument(input: CategorizeDocumentInput): Promise<CategorizeDocumentOutput> {
  return categorizeDocumentFlow(input);
}


const prompt = ai.definePrompt({
    name: 'categorizeDocumentPrompt',
    input: { schema: CategorizeDocumentInputSchema },
    output: { schema: CategorizeDocumentOutputSchema },
    prompt: `You are an expert document organizer. Analyze the following document content and determine the single best folder category for it. The category name should be concise, 2-3 words at most. Examples: "Financial Reports", "Marketing Plans", "Project Phoenix", "Legal Contracts", "User Research".

    DOCUMENT CONTENT:
    ---
    {{{textContent}}}
    ---
    `,
});


// Define the Genkit flow
const categorizeDocumentFlow = ai.defineFlow(
  {
    name: 'categorizeDocumentFlow',
    inputSchema: CategorizeDocumentInputSchema,
    outputSchema: CategorizeDocumentOutputSchema,
  },
  async (input) => {
    // If content is very short, categorize as "Notes and Drafts"
    if (input.textContent.length < 200) {
        return { category: "Notes and Drafts" };
    }
    
    const {output} = await prompt(input);
    return output!;
  }
);
