
'use server';

import { ai } from '@/ai/genkit';
import { Message } from './chat/page';

export async function ask(
  question: string,
  context: string,
  history: Message[]
): Promise<ReadableStream<string>> {
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

  const response = await ai.generate({
    model: ai.model,
    prompt: prompt,
    history,
  });

  const stream = response.stream();
  const reader = stream.getReader();
  const readableStream = new ReadableStream<string>({
    async start(controller) {
      function push() {
        reader.read().then(({ done, value }) => {
          if (done) {
            controller.close();
            return;
          }
          controller.enqueue(value.text);
          push();
        });
      }
      push();
    },
  });

  return readableStream;
}
