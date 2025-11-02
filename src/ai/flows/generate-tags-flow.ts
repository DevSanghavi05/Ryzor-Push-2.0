
'use server';
/**
 * @fileOverview A flow for generating relevant tags for a document.
 *
 * - generateTags - A function that handles tag generation.
 * - GenerateTagsInput - The input type for the function.
 * - GenerateTagsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// Define Zod schemas for input and output
const GenerateTagsInputSchema = z.object({
  textContent: z.string().describe('The text content of the document.'),
});
export type GenerateTagsInput = z.infer<typeof GenerateTagsInputSchema>;

const GenerateTagsOutputSchema = z.object({
  tags: z.array(z.string()).describe('A list of 3-5 relevant keywords or tags for the document.'),
});
export type GenerateTagsOutput = z.infer<typeof GenerateTagsOutputSchema>;


// The main exported function that wraps the Genkit flow
export async function generateTags(input: GenerateTagsInput): Promise<GenerateTagsOutput> {
  return generateTagsFlow(input);
}


const prompt = ai.definePrompt({
    name: 'generateTagsPrompt',
    input: { schema: GenerateTagsInputSchema },
    output: { schema: GenerateTagsOutputSchema },
    prompt: `You are an expert at analyzing documents and extracting key information. Analyze the following document content and generate a list of 3-5 relevant keywords or tags that summarize the main topics. Tags should be concise and no more than 2 words each.

    DOCUMENT CONTENT (first 5000 characters):
    ---
    {{{textContent}}}
    ---
    `,
});


// Define the Genkit flow
const generateTagsFlow = ai.defineFlow(
  {
    name: 'generateTagsFlow',
    inputSchema: GenerateTagsInputSchema,
    outputSchema: GenerateTagsOutputSchema,
  },
  async (input) => {
    if (!input.textContent.trim()) {
        return { tags: [] };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
