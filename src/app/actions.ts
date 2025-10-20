
'use server';

import { ai } from '@/ai/genkit';
import { Message } from './page';

async function getDocumentContext(docName: string, userId: string): Promise<string | null> {
  const storageKey = `documents_${userId}`;
  const documentsString = localStorage.getItem(storageKey);
  if (!documentsString) return null;

  const documents = JSON.parse(documentsString);
  const targetDoc = documents.find((doc: any) => doc.name === docName);

  return targetDoc?.textContent || null;
}

export async function ask(
  question: string,
  docList: string[],
  history: Message[]
): Promise<ReadableStream<string>> {
  
  // Step 1: Find the most relevant document
  const findDocPrompt = `
    You are an expert document router. Given a user's question and a list of available documents, your task is to identify the single most relevant document to answer the question.
    Respond with only the exact name of the most relevant document from the list. Do not add any other text.

    Available documents:
    ${docList.join('\n')}

    User question: "${question}"

    Relevant document:
  `;

  const docChoiceResponse = await ai.generate({
    model: ai.model,
    prompt: findDocPrompt,
    history: [], // History is not needed for routing
  });

  const relevantDocName = docChoiceResponse.text.trim();
  const docExists = docList.includes(relevantDocName);
  
  let context = '';
  // This part is tricky because we can't access localStorage on the server.
  // The logic in the component will need to fetch the context and we will need another action.
  // For now, let's assume we can get it. This will be a conceptual change and might need client-side adjustments.
  // The real implementation will be that the client gets the doc name, retrieves context, and calls a *second* action.
  // Let's create that second action.
  
  // The original 'ask' is now a router. We need a new function to generate the final answer.
  // Let's call it generateAnswer. The client will call this.

  // We will repurpose 'ask' to do the whole thing, but conceptually it's two steps.
  // The client side will have to be changed to do this. For now, let's just pretend we can get context here.
  // This is a big architectural change. Let's simplify.
  // The client will get the list of docs, and pass ALL context. 
  // The prompt will guide the AI to first find the relevant doc internally.
  
  const prompt = `
    You are Ryzor AI, an expert analyst and helpful assistant. Your primary task is to provide insightful, accurate, and well-structured answers to questions based on the provided document context. You can also perform generative tasks like drafting content based on the documents.

    Your guiding principles are:
    1.  **Synthesize and Generate:** Use the provided document(s) as your primary source of truth. You can summarize, rephrase, expand upon, and generate new content (like drafts or longer explanations) based on the information and themes present in the documents. First, internally identify which document is most relevant to the user's question.
    2.  **Cite Sources (Implicitly):** Your language should make it clear that the information comes from the documents (e.g., "According to the Q3 report...", "The marketing plan outlines...").
    3.  **Clear Formatting:** Use Markdown (bold, italics, bullet points, etc.) to structure your answers for maximum readability.
    4.  **Acknowledge Limitations:** If an answer absolutely cannot be informed by the provided context, you MUST state: "I cannot answer this question based on the provided documents." Do not try to guess or infer information that isn't present.

    CONTEXT:
    ---
    ${docList.join('\n\n---\n\n')}
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
