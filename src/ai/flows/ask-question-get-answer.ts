'use server';

/**
 * @fileOverview A question answering AI agent that retrieves relevant chunks from a PDF and answers a user's question.
 *
 * - askQuestionGetAnswer - A function that handles the question answering process.
 * - AskQuestionGetAnswerInput - The input type for the askQuestionGetAnswer function.
 * - AskQuestionGetAnswerOutput - The return type for the askQuestionGetAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AskQuestionGetAnswerInputSchema = z.object({
  question: z.string().describe('The user question.'),
  relevantChunks: z.array(z.string()).describe('The relevant chunks from the PDF.'),
});
export type AskQuestionGetAnswerInput = z.infer<typeof AskQuestionGetAnswerInputSchema>;

const AskQuestionGetAnswerOutputSchema = z.object({
  answer: z.string().describe('The answer to the user question.'),
});
export type AskQuestionGetAnswerOutput = z.infer<typeof AskQuestionGetAnswerOutputSchema>;

const prompt = ai.definePrompt({
  name: 'askQuestionGetAnswerPrompt',
  input: {schema: AskQuestionGetAnswerInputSchema},
  output: {schema: AskQuestionGetAnswerOutputSchema},
  prompt: `You are an AI assistant helping users answer questions about a PDF document.

  Use the following relevant chunks from the PDF to answer the user's question.
  Relevant chunks:
  {{#each relevantChunks}}
  ---\n  {{{this}}}
  {{/each}}

  Question: {{{question}}}
  Answer: `,
});

const askQuestionGetAnswerFlow = ai.defineFlow(
  {
    name: 'askQuestionGetAnswerFlow',
    inputSchema: AskQuestionGetAnswerInputSchema,
    outputSchema: AskQuestionGetAnswerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function askQuestionGetAnswer(input: AskQuestionGetAnswerInput): Promise<AskQuestionGetAnswerOutput> {
  return askQuestionGetAnswerFlow(input);
}
