
'use server';

import { ai } from '@/ai/genkit';
import { Message } from './page';

export async function ask(
  question: string,
  context: string,
  history: Message[]
): Promise<ReadableStream<string>> {
  const prompt = `
    You are Ryzor AI, an expert analyst and helpful assistant. Your task is to provide insightful, accurate, and well-structured answers to questions based *only* on the provided document context.

    Your guiding principles are:
    1.  **Strictly Context-Based:** All information in your answer must be directly derived from the text provided in the "CONTEXT" section. Do not use any outside knowledge.
    2.  **Synthesize, Don't Just List:** If multiple documents address the question, synthesize the information into a single, cohesive answer.
    3.  **Cite Sources (Implicitly):** While you don't need to add formal citations, your language should make it clear that the information comes from the documents (e.g., "According to the Q3 report...", "The marketing plan outlines...").
    4.  **Clear Formatting:** Use Markdown (bold, italics, bullet points, etc.) to structure your answers for maximum readability.
    5.  **Acknowledge Limitations:** If the answer cannot be found in the provided context, you MUST state: "I cannot answer this question based on the provided documents." Do not try to guess or infer information that isn't present.

    CONTEXT:
    ---
    ${context}
    ---

    QUESTION:
    ${question}
  `;

  const { stream } = await ai.generateStream({
    model: ai.model,
    prompt: prompt,
    history,
  });

  const readableStream = new ReadableStream<string>({
    async start(controller) {
      for await (const chunk of stream) {
        controller.enqueue(chunk.text);
      }
      controller.close();
    },
  });

  return readableStream;
}
