
'use server';

import { ai } from '@/ai/genkit';
import { Message } from './page';

export async function ask(
  question: string,
  docList: {name: string, content: string}[],
  history: Message[]
): Promise<ReadableStream<Uint8Array>> {
  
  // Step 1: Find the most relevant documents (plural)
  const findDocsPrompt = `
    You are an expert document router. Given a user's question and a list of available documents, your task is to identify ALL relevant documents to answer the question.
    Respond with a list of the exact names of the relevant documents, each on a new line. Do not add any other text. If no documents are relevant, respond with an empty list.

    Available documents:
    ${docList.map(d => d.name).join('\n')}

    User question: "${question}"

    Relevant document(s):
  `;

  const docChoiceResponse = await ai.generate({
    model: ai.model,
    prompt: findDocsPrompt,
    history: [], // History is not needed for routing
  });

  const relevantDocNames = docChoiceResponse.text.trim().split('\n').filter(name => name.trim() !== '');
  
  let context = '';
  
  if (relevantDocNames.length > 0) {
      const relevantDocs = docList.filter(d => relevantDocNames.includes(d.name));
      if (relevantDocs.length > 0) {
        context = relevantDocs.map(d => `Document: ${d.name}\n\n${d.content}`).join('\n\n---\n\n');
      }
  }
  
  if (!context) {
      // Fallback if the AI fails to select a doc or no docs are relevant.
      // We'll provide all content to give it a chance to answer.
      context = docList.map(d => `Document: ${d.name}\n\n${d.content}`).join('\n\n---\n\n');
  }

  // Step 2: Generate the answer using the full content of the chosen documents.
  const stream = await generateAnswer(question, context, history);
  return stream;
}

async function generateAnswer(question: string, context: string, history: Message[]): Promise<ReadableStream<Uint8Array>> {
    const prompt = `
    You are Ryzor, an expert analyst and helpful assistant. Your primary task is to provide insightful, accurate, and well-structured answers to questions based on the provided document context. You can also perform generative tasks like drafting content based on the documents.

    Your guiding principles are:
    1.  **Synthesize and Generate:** Use the provided document(s) as your primary source of truth. You can summarize, rephrase, expand upon, and generate new content (like drafts or longer explanations) based on the information and themes present in the documents. 
    2.  **Cite Sources (Implicitly):** Your language should make it clear that the information comes from the documents (e.g., "According to the Q3 report...", "The marketing plan outlines..."). If you synthesize info from multiple documents, mention them.
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

    
