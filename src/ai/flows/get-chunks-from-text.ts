'use server';

/**
 * @fileOverview An AI agent that splits text into chunks and finds relevant ones based on a query.
 *
 * - getChunks - A function that handles the chunking and retrieval process.
 * - GetChunksInput - The input type for the getChunks function.
 * - GetChunksOutput - The return type for the getChunks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetChunksInputSchema = z.object({
  text: z.string().describe('The full text of the document.'),
  query: z.string().describe('The user\'s query to find relevant chunks for.'),
});
export type GetChunksInput = z.infer<typeof GetChunksInputSchema>;

const GetChunksOutputSchema = z.object({
  chunks: z.array(z.string()).describe('An array of text chunks relevant to the user\'s query.'),
});
export type GetChunksOutput = z.infer<typeof GetChunksOutputSchema>;


const getChunksFlow = ai.defineFlow(
  {
    name: 'getChunksFlow',
    inputSchema: GetChunksInputSchema,
    outputSchema: GetChunksOutputSchema,
  },
  async ({ text, query }) => {
    // A simple chunking strategy. In a real app, you'd use a more robust method.
    const rawChunks = text.split(/\n\s*\n/).filter(chunk => chunk.trim().length > 10);

    const chunkingPrompt = ai.definePrompt({
      name: 'chunkRelevancePrompt',
      input: {
        schema: z.object({
          query: z.string(),
          chunks: z.array(z.string()),
        })
      },
      output: {
        schema: z.object({
          relevantChunkIndices: z.array(z.number()).describe('The indices of the chunks that are most relevant to the query.')
        })
      },
      prompt: `You are a text processing expert. From the following text chunks, identify the indices of the 3 to 5 chunks that are most relevant to answering the user's query.

      Query: {{{query}}}
      
      Chunks:
      {{#each chunks}}
      [Chunk {{index}}]: {{{this}}}
      ---
      {{/each}}
      
      Respond with only the indices of the most relevant chunks.`,
    });

    const { output } = await chunkingPrompt({
        query,
        chunks: rawChunks
    });

    if (!output) {
      return { chunks: [] };
    }

    const relevantChunks = output.relevantChunkIndices.map(index => rawChunks[index]).filter(Boolean);

    return { chunks: relevantChunks };
  }
);

export async function getChunks(input: GetChunksInput): Promise<GetChunksOutput> {
  return getChunksFlow(input);
}
