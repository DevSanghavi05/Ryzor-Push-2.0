
'use server';

import { ai } from '@/ai/genkit';

export interface Message {
  role: 'user' | 'model';
  content: string;
}

export async function ask(question: string, context: string): Promise<string> {
  const prompt = `
    You are an expert analyst and helpful AI assistant. Your task is to provide insightful answers to questions based *only* on the provided document context.
    Analyze the context to answer not just what is explicitly stated, but also to provide analysis and logical reasoning based on the text.
    For example, if asked to "improve" a text, you should analyze its content and provide actionable suggestions.
    Structure your answers clearly. Use markdown for formatting, such as bullet points, bolding, and italics when it improves readability.
    If the answer cannot be reasonably inferred from the context, state that you cannot answer based on the provided document.

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
