'use server';

import { ai } from '@/ai/genkit';
import { Message } from './page';
import { extractGoogleDocContent } from '@/ai/flows/extract-google-doc-content';
import { extractPdfText } from '@/ai/flows/extract-pdf-text-flow';

async function getDocumentContent(doc: any, workToken?: string | null, personalToken?: string | null): Promise<string> {
    // For local files, the content is passed directly in the 'doc' object from the client.
    if (doc.source === 'local') {
        return doc.content || '';
    }

    if (doc.source === 'drive') {
        const token = doc.accountType === 'work' ? workToken : personalToken;
        if (!token) {
            console.warn(`No token for ${doc.accountType} account, cannot fetch content for ${doc.name}`);
            return '';
        }
        
        try {
            // For Drive files, we always fetch content on the server using the appropriate flow
            if (doc.mimeType === 'application/pdf') {
                 const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!fileResponse.ok) throw new Error(`Failed to fetch PDF content from Drive: ${fileResponse.statusText}`);
                
                const arrayBuffer = await fileResponse.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString('base64');
                const dataURI = `data:${doc.mimeType};base64,${base64}`;

                const { text } = await extractPdfText({ pdfDataUri: dataURI });
                return text;
            } else {
                const { content } = await extractGoogleDocContent({ fileId: doc.id, mimeType: doc.mimeType, accessToken: token });
                return content;
            }
        } catch (error: any) {
            console.error(`Failed to fetch content for ${doc.name}:`, error.message);
            return ''; // Return empty string on failure
        }
    }
    
    // Fallback for any other case
    return doc.content || '';
}


export async function ask(
  question: string,
  docList: any[],
  history: Message[],
  tokens: { work: string | null, personal: string | null }
): Promise<ReadableStream<Uint8Array>> {
  
  let relevantDocs = docList;
  const mentionMatch = question.match(/@"(.*?)"/);

  // Step 1: Handle @mentions first
  if (mentionMatch) {
    const mentionedDocName = mentionMatch[1];
    const mentionedDoc = docList.find(d => d.name.toLowerCase() === mentionedDocName.toLowerCase());
    if (mentionedDoc) {
      relevantDocs = [mentionedDoc];
    }
  } 
  // Step 2: If no @mention, route to relevant documents IF more than one document is available to choose from.
  else if (docList.length > 1) {
    const previewDocs = await Promise.all(
        docList.map(async (d) => {
            // Server-side content preview generation
            const previewContent = (await getDocumentContent(d, tokens.work, tokens.personal)).substring(0, 2000);
            return { name: d.name, tags: d.tags || [], content: previewContent, id: d.id };
        })
    );

    const findDocsPrompt = `
      You are an expert document router. Given a user's question and a list of available documents (with names, tags, and a short content preview), your task is to identify ALL relevant documents to answer the question.
      Consider the document name, its tags, and the content preview. Respond with a list of the exact names of the relevant documents, each on a new line, prefixed with '- '. Do not add any other text. If no documents are relevant, respond with an empty list.

      Available documents:
      ${previewDocs.map(d => `- ${d.name} (Tags: ${d.tags ? d.tags.join(', ') : 'None'})\nPreview: ${d.content.substring(0,100)}...`).join('\n')}

      User question: "${question}"

      Relevant document(s):
    `;

    const docChoiceResponse = await ai.generate({
      model: ai.model,
      prompt: findDocsPrompt,
      history: [], // History is not needed for routing
    });

    const relevantDocNames = docChoiceResponse.text.trim().split('\n').filter(name => name.trim() !== '' && name.startsWith('- ')).map(name => name.substring(2).trim().replace(/ \(Tags:.*\)/, '').replace(/Preview:.*$/, '').trim());
    
    if (relevantDocNames.length > 0) {
        const foundDocs = docList.filter(d => relevantDocNames.includes(d.name));
        if (foundDocs.length > 0) {
          relevantDocs = foundDocs;
        }
    }
    // If routing fails or selects no docs, we fall back to using ALL provided docs in `docList`.
  }

  // Step 3: Fetch the FULL content for the chosen documents on the server.
  const fullContentPromises = relevantDocs.map(d => getDocumentContent(d, tokens.work, tokens.personal));
  const fullContents = await Promise.all(fullContentPromises);

  const context = relevantDocs.map((doc, i) => {
      return `Document: ${doc.name}\n\n${fullContents[i] || 'Content not available.'}`;
  }).join('\n\n---\n\n');


  // Step 4: Generate the answer using the full content.
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
