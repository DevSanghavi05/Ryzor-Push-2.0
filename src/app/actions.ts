
'use server';

import { ai } from '@/ai/genkit';
import { Message } from './page';

export async function ask(
  question: string,
  docList: {name: string, content: string}[],
  history: Message[]
): Promise<ReadableStream<Uint8Array>> {
  
  // Step 1: Find the most relevant document
  const findDocPrompt = `
    You are an expert document router. Given a user's question and a list of available documents, your task is to identify the single most relevant document to answer the question.
    Respond with only the exact name of the most relevant document from the list. Do not add any other text.

    Available documents:
    ${docList.map(d => d.name).join('\n')}

    User question: "${question}"

    Relevant document:
  `;

  const docChoiceResponse = await ai.generate({
    model: ai.model,
    prompt: findDocPrompt,
    history: [], // History is not needed for routing
  });

  const relevantDocName = docChoiceResponse.text.trim();
  const relevantDoc = docList.find(d => d.name === relevantDocName);
  
  if (!relevantDoc) {
      // Fallback if the AI fails to select a doc or hallucinates a name.
      // We'll just provide all content.
      const allContent = docList.map(d => `Document: ${d.name}\n\n${d.content}`).join('\n\n---\n\n');
       const fallbackStream = await generateAnswer(question, allContent, history);
       return fallbackStream;
  }

  // Step 2: Generate the answer using the full content of the chosen document.
  const stream = await generateAnswer(question, `Document: ${relevantDoc.name}\n\n${relevantDoc.content}`, history);
  return stream;
}

async function generateAnswer(question: string, context: string, history: Message[]): Promise<ReadableStream<Uint8Array>> {
    const prompt = `
    You are Ryzor, an expert analyst and helpful assistant. Your primary task is to provide insightful, accurate, and well-structured answers to questions based on the provided document context. You can also perform generative tasks like drafting content based on the documents.

    Your guiding principles are:
    1.  **Synthesize and Generate:** Use the provided document(s) as your primary source of truth. You can summarize, rephrase, expand upon, and generate new content (like drafts or longer explanations) based on the information and themes present in the documents. 
    2.  **Cite Sources (Implicitly):** Your language should make it clear that the information comes from the documents (e.g., "According to the Q3 report...", "The marketing plan outlines...").
    3.  **Clear Formatting:** Use Markdown (bold, italics, bullet points, etc.) to structure your answers for maximum readability.
    4.  **Acknowledge Limitations:** If an answer absolutely cannot be informed by the provided context, you MUST state: "I cannot answer this question based on the provided documents." Do not try to guess or infer information that isn't present.

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

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        controller.enqueue(encoder.encode(chunk.text));
      }
      controller.close();
    },
  });

  return readableStream;
}

    