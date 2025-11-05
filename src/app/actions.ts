
'use server';

import { ai } from '@/ai/genkit';
import { Message } from './page';

/**
 * Streams AI-generated answers based on the provided context and history.
 */
export async function ask(
  question: string,
  context: string,
  history: Message[]
): Promise<ReadableStream<Uint8Array>> {
  const prompt = `
You are **Ryzor**, an expert AI analyst.
Use ONLY the provided document context to answer the question. Your answer should be clear, structured, and specific.

- If you combine insights from multiple documents, say so.
- If the answer cannot be found in the provided documents, you MUST respond with: "I cannot answer this question based on the provided documents."

Context:
---
${context || 'No document context provided.'}
---

Question:
${question}
`;

  const { stream } = await ai.generateStream({
    model: 'googleai/gemini-2.5-flash',
    prompt,
    history,
  });

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        controller.enqueue(encoder.encode(chunk.text));
      }
      controller.close();
    },
  });
}
