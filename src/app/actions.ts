
'use server';

import { ai } from '@/ai/genkit';

export interface Message {
  role: 'user' | 'model';
  content: string;
}

export async function ask(question: string, context: string): Promise<string> {
  const prompt = `
    You are a helpful AI assistant that answers questions based on the provided document context.
    Do not use any information outside of the context provided.
    If the answer is not in the context, say "I can't answer that based on the document."

    CONTEXT:
    ${context}

    QUESTION:
    ${question}
  `;

  const llmResponse = await ai.generate({
    model: ai.model,
    prompt: prompt,
  });

  return llmResponse.text;
}
