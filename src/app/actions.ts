
'use server';

import { ai } from '@/ai/genkit';
import { Message } from './page';
import { extractGoogleDocContent } from '@/ai/flows/extract-google-doc-content';

interface DocumentContext {
  id: string;
  name: string;
  source: 'drive' | 'local';
  accountType: 'work' | 'personal';
  mimeType: string;
  content?: string; // Content for local files is passed from client
}

interface AskApiParams {
  question: string;
  documents: DocumentContext[];
  history: Message[];
  workAccessToken?: string | null;
  personalAccessToken?: string | null;
}

/**
 * Retrieves the content for a given document.
 * For Google Drive files, it uses the appropriate access token to fetch content.
 * For local files, it uses the content passed from the client.
 */
async function getDocumentContent(
  doc: DocumentContext,
  workAccessToken?: string | null,
  personalAccessToken?: string | null
): Promise<string> {
  // If content is already provided (from local files), use it directly.
  if (doc.content) {
    return doc.content;
  }

  // If it's a Drive file, fetch the content using the new flow.
  if (doc.source === 'drive') {
    const accessToken = doc.accountType === 'work' ? workAccessToken : personalAccessToken;
    if (!accessToken) {
      return '(Access token not available)';
    }

    try {
      const result = await extractGoogleDocContent({
        fileId: doc.id,
        mimeType: doc.mimeType,
        accessToken,
      });
      return result.content;
    } catch (error: any) {
      console.error(`Failed to fetch content for ${doc.name}: ${error.message}`);
      return `(Error fetching content: ${error.message})`;
    }
  }

  return '(No extractable content)';
}

/**
 * Streams AI-generated answers based on the provided context and history.
 */
export async function ask(params: AskApiParams): Promise<ReadableStream<Uint8Array>> {
  const { question, documents, history, workAccessToken, personalAccessToken } = params;

  // Concurrently fetch content for all documents
  const contentPromises = documents.map(doc => 
    getDocumentContent(doc, workAccessToken, personalAccessToken).then(content => {
        // Truncate content to first 5000 characters to avoid rate limits
        const truncatedContent = content.substring(0, 5000);
        return `Document: ${doc.name}\nContent: ${truncatedContent}`
    })
  );

  const resolvedContents = await Promise.all(contentPromises);
  const context = resolvedContents.join('\n\n---\n\n');

  const prompt = `
You are **Ryzor**, an expert AI analyst.
Use ONLY the provided document context to answer the question. Your answer should be clear, structured, and specific.

- **CRITICAL**: When you use information from a specific document, you MUST cite it by its name prefixed with an '@' symbol, for example: @Q3_financials.pdf. The name must be an exact match to the document name provided in the context.
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
