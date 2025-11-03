'use server';

import { ai } from '@/ai/genkit';
import { Message } from './page';
import { extractGoogleDocContent } from '@/ai/flows/extract-google-doc-content';
import { extractPdfText } from '@/ai/flows/extract-pdf-text-flow';

/**
 * Fetches and extracts text from a given document, whether local, Google Drive (PDF or Doc), or other.
 */
async function getDocumentContent(
  doc: any,
  workToken?: string | null,
  personalToken?: string | null
): Promise<string> {
  try {
    // 🟩 Local file: content already provided
    if (doc.source === 'local') {
        const content = localStorage.getItem(`document_content_${doc.id}`);
        return content || '';
    }

    // 🟨 Google Drive file
    if (doc.source === 'drive') {
      const token = doc.accountType === 'work' ? workToken : personalToken;
      if (!token) {
        console.warn(`No token for ${doc.accountType} account (${doc.name})`);
        return '';
      }

      // 🧾 PDFs from Drive
      if (doc.mimeType === 'application/pdf') {
        const fileResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!fileResponse.ok)
          throw new Error(`Drive PDF fetch failed: ${fileResponse.statusText}`);

        const arrayBuffer = await fileResponse.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const dataURI = `data:${doc.mimeType};base64,${base64}`;

        const { text } = await extractPdfText({ pdfDataUri: dataURI });
        return text || '';
      }

      // 📝 Google Docs, Sheets, Slides, etc.
      const { content } = await extractGoogleDocContent({
        fileId: doc.id,
        mimeType: doc.mimeType,
        accessToken: token,
      });
      return content || '';
    }

    // 🩶 Fallback
    return doc.content || '';
  } catch (err: any) {
    console.error(`❌ Error extracting content for ${doc.name}:`, err.message);
    return '';
  }
}

/**
 * Main function that handles document routing, content extraction, and AI answering.
 */
export async function ask(
  question: string,
  docList: any[],
  history: Message[],
  tokens: { work: string | null; personal: string | null }
): Promise<ReadableStream<Uint8Array>> {
  let relevantDocs = docList;
  const mentionMatch = question.match(/@"(.*?)"/);

  // 🔹 Step 1: Handle @mentions
  if (mentionMatch) {
    const mentionedName = mentionMatch[1].toLowerCase();
    const mentionedDoc = docList.find(
      (d) => d.name.toLowerCase() === mentionedName
    );
    if (mentionedDoc) relevantDocs = [mentionedDoc];
  }

  // 🔹 Step 2: Route to relevant documents if multiple are available
  else if (docList.length > 1) {
    const previews = await Promise.all(
      docList.map(async (d) => {
        const previewText = (
          await getDocumentContent(d, tokens.work, tokens.personal)
        ).slice(0, 2000);
        return {
          name: d.name,
          tags: d.tags || [],
          preview: previewText,
        };
      })
    );

    const routingPrompt = `
You are an expert document router.
Given the user's question and the following documents, identify ALL relevant ones.

Documents:
${previews
  .map(
    (d) =>
      `- ${d.name} (Tags: ${d.tags.join(', ') || 'None'})\nPreview: ${
        d.preview || 'No content.'
      }`
  )
  .join('\n\n')}

Question: "${question}"

List the exact document names that are relevant, one per line, prefixed with "- ".
`;

    const routingResponse = await ai.generate({
      model: ai.model,
      prompt: routingPrompt,
      history: [],
    });

    const relevantNames = routingResponse.text
      .split('\n')
      .filter((l) => l.startsWith('- '))
      .map((l) => l.slice(2).trim());

    const foundDocs = docList.filter((d) => relevantNames.includes(d.name));
    if (foundDocs.length > 0) relevantDocs = foundDocs;
  }

  // 🔹 Step 3: Fetch full document content for AI context
  const fullContents = await Promise.all(
    relevantDocs.map((d) => getDocumentContent(d, tokens.work, tokens.personal))
  );

  const context = relevantDocs
    .map(
      (d, i) => `
📄 **${d.name}**
${fullContents[i] || '(No extractable content)'}
`
    )
    .join('\n\n---\n\n');

  // 🔹 Step 4: Generate final AI answer
  return await generateAnswer(question, context, history);
}

/**
 * Streams AI-generated answers based on the provided context.
 */
async function generateAnswer(
  question: string,
  context: string,
  history: Message[]
): Promise<ReadableStream<Uint8Array>> {
  const prompt = `
You are **Ryzor**, an expert AI analyst.
Use ONLY the provided document context to answer the question.

Guidelines:
- Be clear, structured, and specific.
- If you combine insights from multiple docs, say so.
- If the answer cannot be found in the docs, respond: 
  "I cannot answer this question based on the provided documents."

Context:
---
${context}
---

Question:
${question}
`;

  const { stream } = await ai.generateStream({
    model: ai.model,
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
